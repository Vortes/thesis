"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, Mail, CheckCircle2 } from "lucide-react"

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [progress, setProgress] = useState(33)
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [email, setEmail] = useState("")

  const handleLocationRequest = () => {
    setIsLocationDialogOpen(true)
  }

  const confirmLocation = () => {
    // Simulate location request
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Location access granted", position)
        setIsLocationDialogOpen(false)
        setStep(2)
        setProgress(66)
      },
      (error) => {
        console.error("Location access denied", error)
        // Handle error or re-prompt - for now just close dialog
        setIsLocationDialogOpen(false)
        // Ideally show an error message or retry
      }
    )
  }

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate invite sending
    console.log("Invite sent to:", email)
    setStep(3)
    setProgress(100)
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
                    />
                  </div>
                </form>
              </CardContent>
              <CardFooter>
                <Button type="submit" form="invite-form" className="w-full">
                  Send Invite
                </Button>
              </CardFooter>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Messenger Assigned!</CardTitle>
                <CardDescription>
                  Great news! Your messenger pet has been assigned and is ready to go.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="p-6 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="font-medium text-slate-900">Your Pet: 🦉 Oliver the Owl</p>
                  <p className="text-sm text-slate-500">Oliver is fast and wise!</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => console.log("Go to dashboard")}>
                  Go to Dashboard
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
