import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, Edit, ArrowLeft, Image as ImageIcon, Phone, QrCode, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, authHeader } from "@/lib/api";

export default function Profile() {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          toast({ title: "Please log in", description: "You must be logged in to view your profile.", variant: "destructive" });
          navigate("/login");
          return;
        }
        const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
          method: "GET",
          headers: { ...authHeader() },
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to load profile. Please try again.");
        }
        const data = await response.json();
        setProfile(data);
      } catch (err: any) {
        toast({ title: "Error", description: err?.message || "Failed to load profile", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate, toast]);

  const handleChange = (field: string, value: string) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please use a file smaller than 5MB.", variant: "destructive" });
        return;
      }
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQrCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please use a file smaller than 5MB.", variant: "destructive" });
        return;
      }
      setQrCodeFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setQrCodePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProfilePhoto = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/profile/me/photo`, {
        method: "DELETE",
        headers: { ...authHeader() },
      });

      if (!response.ok) {
        throw new Error("Failed to delete profile photo");
      }

      const data = await response.json();
      setProfile(data.user);
      setProfilePhotoFile(null);
      setProfilePhotoPreview(null);
      toast({ title: "Profile photo deleted", description: "Your profile photo has been removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to delete profile photo", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQrCode = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/profile/me/qr`, {
        method: "DELETE",
        headers: { ...authHeader() },
      });

      if (!response.ok) {
        throw new Error("Failed to delete QR code");
      }

      const data = await response.json();
      setProfile(data.user);
      setQrCodeFile(null);
      setQrCodePreview(null);
      toast({ title: "QR code deleted", description: "Your payment QR code has been removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to delete QR code", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      const formData = new FormData();
      
      // Always append all fields - backend will handle empty values
      formData.append("fullName", profile.fullName || "");
      formData.append("email", profile.email || "");
      formData.append("phoneNumber", profile.phoneNumber || "");
      formData.append("branch", profile.branch || "");
      formData.append("course", profile.course || "");
      formData.append("classYear", profile.classYear || "");
      formData.append("semester", profile.semester || "");
      
      if (profilePhotoFile) {
        formData.append("profilePhoto", profilePhotoFile);
      }
      if (qrCodeFile) {
        formData.append("qrCode", qrCodeFile);
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
        method: "PATCH",
        headers: {
          ...authHeader(),
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update profile. Please try again.");
      }

      const updatedData = await response.json();
      setProfile(updatedData.user);
      setProfilePhotoFile(null);
      setQrCodeFile(null);
      setProfilePhotoPreview(null);
      setQrCodePreview(null);
      
      toast({ title: "Profile updated", description: "Your personal details have been saved." });
      setEditing(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.fullName || profile?.rollNumber || "?")
    .split(" ")
    .filter(Boolean)
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">Profile</h1>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setEditing(!editing)}>
          <Edit className="h-4 w-4" /> {editing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      {/* Profile Card + QR / payment info */}
      <div className="p-6 rounded-2xl border border-border bg-card card-shadow space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="relative">
                {profile?.profilePhotoUrl ? (
                  <img
                    src={profile.profilePhotoUrl}
                    alt="Profile"
                    className="h-24 w-24 rounded-2xl object-cover border border-border"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl gradient-bg flex items-center justify-center text-3xl font-bold text-primary-foreground shrink-0">
                    {initials}
                  </div>
                )}
                {editing && (
                  <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <h2 className="font-display text-xl font-bold">
                  {profile?.fullName || "Your Name"}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile?.branch || "Branch not set"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {profile?.classYear || "Year not set"}
                    {profile?.semester ? ` · Sem ${profile.semester}` : ""}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  {profile?.email && (
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-3.5 w-3.5" />
                      {profile.email}
                    </span>
                  )}
                  {profile?.phoneNumber && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {profile.phoneNumber}
                    </span>
                  )}
                </div>
              </div>
              {profile?.qrCodeUrl && (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-24 w-24 rounded-xl border border-dashed border-border flex items-center justify-center bg-muted/40 overflow-hidden">
                    <img src={profile.qrCodeUrl} alt="Payment QR" className="h-full w-full object-contain" />
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <QrCode className="h-3 w-3" /> Payment QR
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit Form */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="font-display font-semibold">Edit Personal Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input
                    value={profile?.fullName || ""}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>College Email</Label>
                  <Input
                    type="email"
                    value={profile?.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input
                    value={profile?.phoneNumber || ""}
                    onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Branch</Label>
                  <Input
                    value={profile?.branch || ""}
                    onChange={(e) => handleChange("branch", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Course</Label>
                  <Input
                    value={profile?.course || ""}
                    onChange={(e) => handleChange("course", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Class Year</Label>
                  <Input
                    placeholder="e.g. 3rd Year"
                    value={profile?.classYear || ""}
                    onChange={(e) => handleChange("classYear", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Semester</Label>
                  <Input
                    placeholder="e.g. 2"
                    value={profile?.semester || ""}
                    onChange={(e) => handleChange("semester", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Profile Photo</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      className="hidden"
                      id="profile-photo-input"
                    />
                    <label htmlFor="profile-photo-input" className="flex flex-col items-center gap-2 cursor-pointer">
                      {profilePhotoPreview ? (
                        <img src={profilePhotoPreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
                      ) : profile?.profilePhotoUrl ? (
                        <img src={profile.profilePhotoUrl} alt="Current" className="h-20 w-20 rounded-lg object-cover" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground text-center">Click to upload photo</span>
                        </>
                      )}
                    </label>
                  </div>
                  {(profile?.profilePhotoUrl || profilePhotoPreview) && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteProfilePhoto}
                      disabled={saving}
                      className="w-full gap-2"
                    >
                      <Trash2 className="h-4 w-4" /> Delete Photo
                    </Button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Payment QR Code</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrCodeChange}
                      className="hidden"
                      id="qr-code-input"
                    />
                    <label htmlFor="qr-code-input" className="flex flex-col items-center gap-2 cursor-pointer">
                      {qrCodePreview ? (
                        <img src={qrCodePreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
                      ) : profile?.qrCodeUrl ? (
                        <img src={profile.qrCodeUrl} alt="Current" className="h-20 w-20 rounded-lg object-cover" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground text-center">Click to upload QR code</span>
                        </>
                      )}
                    </label>
                  </div>
                  {(profile?.qrCodeUrl || qrCodePreview) && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteQrCode}
                      disabled={saving}
                      className="w-full gap-2"
                    >
                      <Trash2 className="h-4 w-4" /> Delete QR Code
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes (for your reference)</Label>
                <Textarea
                  placeholder="Add any extra info you want to remember (not stored yet)."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="gradient-bg text-primary-foreground border-0"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
