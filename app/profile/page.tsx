"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EditProfileDialog } from "@/components/edit-profile-dialog"
import { useState } from "react"
import { useUserProfile } from "@/hooks/use-user-profile"

const ProfilePage = () => {
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const { profile: userProfile, loading: profileLoading, refreshProfile } = useUserProfile()

  if (profileLoading) {
    return <div>Loading profile...</div>
  }

  if (!userProfile) {
    return <div>Could not load profile.</div>
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>View and manage your profile information here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Name</p>
              <p className="text-gray-500">{userProfile.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Email</p>
              <p className="text-gray-500">{userProfile.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Bio</p>
              <p className="text-gray-500">{userProfile.bio || "No bio provided."}</p>
            </div>
            <div>
              <Button onClick={() => setEditDialogOpen(true)}>Edit Profile</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditProfileDialog
        user={userProfile}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onProfileUpdate={refreshProfile} // Aggiungi questa prop
      />
    </div>
  )
}

export default ProfilePage
