import { ThemedView } from "@/components/themed-view";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const REDIRECT_DELAY_MS = 1000;

type CallbackParams = {
  code?: string;
  state?: string;
  error?: string;
  sessionToken?: string;
  user?: string;
};

function decodeUser(value: string): Auth.User {
  const userJson =
    typeof atob !== "undefined"
      ? atob(value)
      : Buffer.from(value, "base64").toString("utf-8");
  const userData = JSON.parse(userJson) as Partial<Auth.User> & { lastSignedIn?: string };
  return {
    id: Number(userData.id),
    openId: String(userData.openId ?? ""),
    name: userData.name ?? null,
    email: userData.email ?? null,
    loginMethod: userData.loginMethod ?? null,
    lastSignedIn: new Date(userData.lastSignedIn || Date.now()),
  };
}

export default function OAuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<CallbackParams>();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const redirectHome = () => {
      redirectTimer = setTimeout(() => {
        if (!disposed) router.replace("/(tabs)");
      }, REDIRECT_DELAY_MS);
    };

    const handleCallback = async () => {
      try {
        if (params.sessionToken) {
          await Auth.setSessionToken(params.sessionToken);
          if (params.user) {
            try {
              await Auth.setUserInfo(decodeUser(params.user));
            } catch {
              // A malformed optional profile must not prevent a valid session from completing.
            }
          }
          if (!disposed) {
            setStatus("success");
            redirectHome();
          }
          return;
        }

        let url: string | null = null;
        if (params.code || params.state || params.error) {
          const urlParams = new URLSearchParams();
          if (params.code) urlParams.set("code", params.code);
          if (params.state) urlParams.set("state", params.state);
          if (params.error) urlParams.set("error", params.error);
          url = `?${urlParams.toString()}`;
        } else {
          url = await Linking.getInitialURL();
        }

        const error =
          params.error || (url ? new URL(url, "http://callback.invalid").searchParams.get("error") : null);
        if (error) {
          if (!disposed) {
            setStatus("error");
            setErrorMessage("Authentication was not completed.");
          }
          return;
        }

        let code = params.code ?? null;
        let state = params.state ?? null;
        let sessionToken: string | null = null;

        if (url && (!code || !state)) {
          try {
            const urlObj = new URL(url);
            code = urlObj.searchParams.get("code");
            state = urlObj.searchParams.get("state");
            sessionToken = urlObj.searchParams.get("sessionToken");
          } catch {
            const match = url.match(/[?&](code|state|sessionToken)=([^&]+)/g);
            match?.forEach((param) => {
              const [key, value] = param.substring(1).split("=");
              if (key === "code") code = decodeURIComponent(value);
              if (key === "state") state = decodeURIComponent(value);
              if (key === "sessionToken") sessionToken = decodeURIComponent(value);
            });
          }
        }

        if (sessionToken) {
          await Auth.setSessionToken(sessionToken);
          if (!disposed) {
            setStatus("success");
            redirectHome();
          }
          return;
        }

        if (!code || !state) {
          if (!disposed) {
            setStatus("error");
            setErrorMessage("Authentication parameters are missing.");
          }
          return;
        }

        const result = await Api.exchangeOAuthCode(code, state);
        if (!result.sessionToken) {
          if (!disposed) {
            setStatus("error");
            setErrorMessage("Authentication could not be completed.");
          }
          return;
        }

        await Auth.setSessionToken(result.sessionToken);
        if (result.user) {
          await Auth.setUserInfo({
            id: result.user.id,
            openId: result.user.openId,
            name: result.user.name,
            email: result.user.email,
            loginMethod: result.user.loginMethod,
            lastSignedIn: new Date(result.user.lastSignedIn || Date.now()),
          });
        }

        if (!disposed) {
          setStatus("success");
          redirectHome();
        }
      } catch (error) {
        if (!disposed) {
          setStatus("error");
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to complete authentication",
          );
        }
      }
    };

    void handleCallback();
    return () => {
      disposed = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [params.code, params.state, params.error, params.sessionToken, params.user, router]);

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
      <ThemedView className="flex-1 items-center justify-center gap-4 p-5">
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" />
            <Text className="mt-4 text-base leading-6 text-center text-foreground">
              Completing authentication...
            </Text>
          </>
        )}
        {status === "success" && (
          <>
            <Text className="text-base leading-6 text-center text-foreground">
              Authentication successful!
            </Text>
            <Text className="text-base leading-6 text-center text-foreground">
              Redirecting...
            </Text>
          </>
        )}
        {status === "error" && (
          <>
            <Text className="mb-2 text-xl font-bold leading-7 text-error">
              Authentication failed
            </Text>
            <Text className="text-base leading-6 text-center text-foreground">
              {errorMessage}
            </Text>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
