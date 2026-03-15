import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/mock-data";
import { Upload, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL, apiFetch, authHeader } from "@/lib/api";

export default function PostWork() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    deadline: "",
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const jobToEdit = (location.state as any)?.jobToEdit;
  const isEdit = !!jobToEdit;

  useEffect(() => {
    if (jobToEdit) {
      setFormData({
        title: jobToEdit.title || "",
        description: jobToEdit.description || "",
        category: jobToEdit.category || "",
        budget: jobToEdit.budget?.toString() || "",
        deadline: jobToEdit.deadline ? new Date(jobToEdit.deadline).toISOString().slice(0, 10) : "",
      });
    }
  }, [jobToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
    }));
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxBytes = 5 * 1024 * 1024; // 5MB
      if (file.size > maxBytes) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      setAttachment(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.title || !formData.description || !formData.category || !formData.budget || !formData.deadline) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (Number(formData.budget) < 39) {
      toast({ title: "Budget too low", description: "Please enter a minimum amount of ₹39.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let targetWorkId: string | null = isEdit ? String(jobToEdit?._id || "") : null;
      const token = localStorage.getItem("token");
      if (!token) {
        toast({ title: "Error", description: "You must be logged in to post work", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (isEdit) {
        // For editing we update only text fields using JSON (simpler and reliable)
        await apiFetch(`/api/work/${jobToEdit._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(),
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            category: formData.category,
            budget: Number(formData.budget),
            deadline: formData.deadline,
          }),
        });
      } else {
        const form = new FormData();
        form.append("title", formData.title);
        form.append("description", formData.description);
        form.append("category", formData.category);
        form.append("budget", formData.budget);
        form.append("deadline", formData.deadline);
        if (attachment) {
          form.append("attachment", attachment);
        }

        const tokenHeader = authHeader();
        const url = `${API_BASE_URL || ""}/api/work`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            ...(tokenHeader.Authorization ? { Authorization: tokenHeader.Authorization } : {}),
          },
          body: form,
        });

        const responseData = await response.json().catch(() => null);
        if (!response.ok) {
          let msg = "Failed to post work. Please try again.";
          if (responseData) {
            msg = responseData.message || msg;
            if (Array.isArray(responseData.missingFields) && responseData.missingFields.length > 0) {
              msg = `${msg} Missing: ${responseData.missingFields.join(", ")}`;
            }
            if (responseData.error && responseData.error.includes("Path `budget`")) {
              msg = "Budget must be at least ₹39.";
            }
          }
          throw new Error(msg);
        }

        targetWorkId = responseData?.work?._id ? String(responseData.work._id) : targetWorkId;
      }
      toast({
        title: isEdit ? "Task Updated!" : "Task Posted!",
        description: isEdit
          ? "Your task details have been updated."
          : "Your task has been published. Students will start applying soon.",
      });
      if (targetWorkId) {
        navigate(`/dashboard/my-services/${targetWorkId}/applicants`);
      } else {
        navigate("/dashboard/my-services");
      }
    } catch (error: any) {
      console.error("Error posting work:", error);
      toast({ title: "Error", description: error.message || "Failed to post work", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold">
            {isEdit ? "Edit Work" : "Post Work"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? "Update your job details" : "Describe what you need help with"}
          </p>
        </div>
      </div>

      <form className="space-y-5 p-6 rounded-2xl border border-border bg-card" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input 
            name="title"
            placeholder="e.g. Need a React dashboard for my project" 
            value={formData.title}
            onChange={handleChange}
            required 
          />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea 
            name="description"
            placeholder="Describe what you need in detail — the more specific, the better..." 
            rows={5}
            value={formData.description}
            onChange={handleChange}
            required 
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={formData.category} onValueChange={handleCategoryChange} required>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Budget (₹)</Label>
            <Input 
              type="number" 
              name="budget"
              placeholder="500" 
              min="39" 
              value={formData.budget}
              onChange={handleChange}
              required 
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Deadline</Label>
          <Input 
            type="date" 
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            required 
          />
        </div>
        <div className="space-y-1.5">
          <Label>Attachments (optional)</Label>
          <label className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer block">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {attachment ? attachment.name : "Click to choose a file"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOC, Images up to 10MB</p>
            <input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              className="hidden"
              onChange={handleAttachmentChange}
            />
          </label>
        </div>
        <div className="flex gap-3">
          <Button type="submit" className="gradient-bg text-primary-foreground border-0" disabled={loading}>
            {loading ? (isEdit ? "Saving..." : "Posting...") : isEdit ? "Save Changes" : "Post Task"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </motion.div>
  );
}
