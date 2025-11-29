"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, Mail, Loader2 } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { completeOnboarding } from "@/app/actions/onboarding"
import { updateUserLocation } from "@/app/actions/user"

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [progress, setProgress] = useState(50)
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [email, setEmail] = useState("")
  const router = useRouter()

  const handleLocationRequest = () => {
    setIsLocationDialogOpen(true)
  }

  const confirmLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log("Location access granted", position)
        try {
          await updateUserLocation(position.coords.latitude, position.coords.longitude)
          setIsLocationDialogOpen(false)
          setStep(2)
          setProgress(100)
          toast.success("Location saved successfully!")
        } catch (error) {
          console.error("Failed to save location", error)
          toast.error("Failed to save location. Please try again.")
        }
      },
      (error) => {
        console.error("Location access denied", error)
        setIsLocationDialogOpen(false)
        toast.error("Location access denied. Please enable it in your browser settings.")
      }
    )
  }

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Failed to send invite")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Invitation sent successfully!")
      setEmail("")
    },
    onError: (error) => {
      console.error("Invite error:", error)
      toast.error("Failed to send invite: " + error.message)
    },
  })

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    inviteMutation.mutate(email)
  }

  const handleFinish = async () => {
    try {
      await completeOnboarding()
      // Redirect is handled in server action via revalidatePath/redirect or client side
      // Since server action is void, we might need to redirect here if not handled there
      // But revalidatePath("/") usually refreshes. 
      // Actually, server action didn't have redirect, so let's do it here.
      router.push("/")
    } catch (error) {
      console.error("Finish error:", error)
      toast.error("Something went wrong.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-4">
        <Progress value={progress} className="w-full" />
        
        <Card className="w-full shadow-lg">
          {step === 1 && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-4">
                  <MapPin className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Enable Location Services</CardTitle>
                <CardDescription>
                  To ensure your messenger knows where to deliver gifts, we need access to your location.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 text-center">
                  A system popup will appear asking for permission. Please click "Allow" to continue.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleLocationRequest}>
                  Share My Location
                </Button>
              </CardFooter>

              <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Allow Location Access?</DialogTitle>
                    <DialogDescription>
                      We need your location to assign your messenger pet and deliver gifts correctly.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsLocationDialogOpen(false)}>Cancel</Button>
                    <Button onClick={confirmLocation}>Allow</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto bg-purple-100 p-3 rounded-full w-fit mb-4">
                  <Mail className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Invite a Friend</CardTitle>
                <CardDescription>
                  Your messenger pet will be assigned once you invite a friend to join.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form id="invite-form" onSubmit={handleInviteSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Friend's Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="friend@example.com" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={inviteMutation.isPending}
                    />
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" form="invite-form" className="w-full" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Invite"
                  )}
                </Button>
                <Button variant="outline" className="w-full" onClick={handleFinish}>
                  Finish & Go to Dashboard
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
