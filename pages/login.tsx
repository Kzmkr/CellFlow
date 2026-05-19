import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { FaGithub } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { API, getCsrfToken } from "@/lib/api"

async function authFetch(path: string, fields: Record<string, string>) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    body: new URLSearchParams(fields),
  })
  return (await res.json()) as { url?: string }
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get("error")
    if (err === "CredentialsSignin") {
      setError("Invalid email or password.")
    } else if (err) {
      setError("Sign in failed. Please try again.")
    }
  }, [])

  async function signInWithGitHub() {
    setLoading(true)
    setError(null)
    try {
      const csrfToken = await getCsrfToken()
      const { url } = await authFetch("/api/auth/signin/github", {
        csrfToken,
        callbackUrl: window.location.origin + "/",
      })
      if (!url) throw new Error("no url")
      window.location.href = url
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const csrfToken = await getCsrfToken()
      const { url } = await authFetch("/api/auth/callback/credentials", {
        csrfToken,
        email,
        password,
        callbackUrl: window.location.origin + "/",
      })
      if (url && !url.includes("error=")) {
        window.location.href = url
      } else {
        setError("Invalid email or password.")
        setLoading(false)
      }
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your Cellflow account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={signInWithGitHub}
              >
                <FaGithub data-icon="inline-start" />
                Continue with GitHub
              </Button>

              <FieldSeparator>or</FieldSeparator>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>

                <Field orientation="horizontal" className="items-center gap-2">
                  <Checkbox id="remember" />
                  <FieldLabel htmlFor="remember" className="font-normal cursor-pointer">
                    Remember me
                  </FieldLabel>
                </Field>
              </FieldGroup>

              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
