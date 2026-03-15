import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/mock-data";
import { Upload } from "lucide-react";

export default function PostJob() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-1">Post a Job</h1>
      <p className="text-sm text-muted-foreground mb-6">Describe what you need and find the right student</p>

      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-1.5">
          <Label>Job Title</Label>
          <Input placeholder="e.g. Need a React dashboard for my project" />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea placeholder="Describe what you need in detail..." rows={5} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select>
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
            <Input type="number" placeholder="500" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Deadline</Label>
          <Input type="date" />
        </div>
        <div className="space-y-1.5">
          <Label>Attachments</Label>
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Drag & drop files or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOC, Images up to 10MB</p>
          </div>
        </div>
        <Button type="submit" className="gradient-bg text-primary-foreground border-0">
          Post Job
        </Button>
      </form>
    </motion.div>
  );
}
