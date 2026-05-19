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

function submitAuthForm(action: string, fields: Record<string, string>) {
  const form = document.createElement("form")
  form.method = "POST"
  form.action = action
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input")
    input.type = "hidden"
    input.name = name
    input.value = value
    form.appendChild(input)
  }
  document.body.appendChild(form)
  form.submit()
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
      submitAuthForm(`${API}/api/auth/signin/github`, {
        csrfToken,
        callbackUrl: window.location.origin + "/",
      })
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
      submitAuthForm(`${API}/api/auth/callback/credentials`, {
        csrfToken,
        email,
        password,
        callbackUrl: window.location.origin + "/",
      })
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