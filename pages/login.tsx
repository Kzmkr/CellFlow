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

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your Cellflow account</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4">
            <Button variant="outline" className="w-full" type="button">
              <FaGithub data-icon="inline-start" />
              Continue with GitHub
            </Button>

            <FieldSeparator>or</FieldSeparator>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
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
                />
              </Field>

              <Field orientation="horizontal" className="items-center gap-2">
                <Checkbox id="remember" />
                <FieldLabel htmlFor="remember" className="font-normal cursor-pointer">
                  Remember me
                </FieldLabel>
              </Field>
            </FieldGroup>

            <Button className="w-full" type="submit">
              Sign in
            </Button>
          </div>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a
              href="#"
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              Sign up
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
