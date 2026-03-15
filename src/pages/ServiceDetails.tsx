import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Clock, CheckCircle, ArrowLeft, MessageSquare, Shield, Award, MapPin, Calendar, ExternalLink, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FEATURED_SERVICES, MOCK_REVIEWS } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function ServiceDetails() {
  const { id } = useParams();
  const { toast } = useToast();
  const service = FEATURED_SERVICES.find((s) => s.id === id) || FEATURED_SERVICES[0];

  const handleOrder = () => {
    toast({ title: "Order Placed!", description: "Your order has been submitted successfully. The seller will be notified." });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Browse
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 space-y-6">
              {/* Hero Image */}
              <div className="h-64 rounded-2xl hero-gradient flex items-center justify-center relative overflow-hidden">
                <span className="text-5xl font-display font-bold gradient-text opacity-20">{service.category.toUpperCase()}</span>
                <Badge className="absolute top-4 left-4 bg-card/90 text-foreground backdrop-blur-sm">{service.category}</Badge>
              </div>

              {/* Title & Meta */}
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-3">{service.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {service.seller.rating} ({service.seller.reviews} reviews)</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {service.deliveryDays} day delivery</span>
                  <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-accent" /> {service.seller.completedJobs} completed</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {service.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="bg-primary/5 border-primary/20 text-primary text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="bg-muted w-full justify-start">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews ({service.seller.reviews})</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                  <div className="grid sm:grid-cols-2 gap-3 mt-4">
                    {[
                      { icon: CheckCircle, text: "100% Original Work" },
                      { icon: Shield, text: "Unlimited Revisions" },
                      { icon: MessageSquare, text: "Fast Communication" },
                      { icon: Clock, text: "On-Time Delivery" },
                      { icon: Award, text: "Quality Guaranteed" },
                      { icon: Shield, text: "Secure Payment" },
                    ].map((f) => (
                      <div key={f.text} className="flex items-center gap-2 text-sm p-3 rounded-xl bg-muted/50">
                        <f.icon className="h-4 w-4 text-accent shrink-0" />
                        {f.text}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="portfolio" className="mt-4">
                  {service.portfolio.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No portfolio items yet.</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {service.portfolio.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="rounded-xl border border-border bg-card overflow-hidden group hover:card-shadow-hover transition-shadow"
                        >
                          <div className="h-32 hero-gradient flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                          <div className="p-3">
                            <p className="text-sm font-medium">{item.title}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reviews" className="mt-4 space-y-4">
                  {/* Review Summary */}
                  <div className="p-4 rounded-xl bg-muted/50 flex items-center gap-6">
                    <div className="text-center">
                      <p className="font-display text-3xl font-bold">{service.seller.rating}</p>
                      <div className="flex gap-0.5 mt-1">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className={`h-3.5 w-3.5 ${j < Math.round(service.seller.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{service.seller.reviews} reviews</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const pct = stars === 5 ? 78 : stars === 4 ? 15 : stars === 3 ? 5 : stars === 2 ? 2 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-muted-foreground">{stars}</span>
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full gradient-bg" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-8 text-right text-muted-foreground">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {MOCK_REVIEWS.map((review, i) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-xl border border-border bg-card"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-9 w-9 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground">{review.avatar}</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{review.reviewer}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} className={`h-3 w-3 ${j < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />)}</div>
                            <span className="text-xs text-muted-foreground">{review.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </motion.div>
                  ))}
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Sidebar */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div className="sticky top-24 space-y-4">
                {/* Pricing Card */}
                <div className="p-6 rounded-2xl border border-border bg-card card-shadow space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Starting at</p>
                    <p className="font-display text-3xl font-bold">₹{service.price}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Delivery Time</span>
                      <span className="font-medium">{service.deliveryDays} day{service.deliveryDays > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Revisions</span>
                      <span className="font-medium">Unlimited</span>
                    </div>
                  </div>
                  <Button onClick={handleOrder} className="w-full gradient-bg text-primary-foreground border-0 h-11">Order Now</Button>
                  <Button variant="outline" className="w-full gap-2">
                    <MessageSquare className="h-4 w-4" /> Contact Seller
                  </Button>
                </div>

                {/* Seller Card */}
                <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                  <h3 className="font-display font-semibold">About the Seller</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-2xl gradient-bg flex items-center justify-center text-xl font-bold text-primary-foreground">
                      {service.seller.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{service.seller.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{service.seller.college}</p>
                      <p className="text-xs text-muted-foreground">{service.seller.department} · {service.seller.year}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-border">
                    <div>
                      <p className="font-display font-bold">{service.seller.rating}</p>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                    <div>
                      <p className="font-display font-bold">{service.seller.completedJobs}</p>
                      <p className="text-xs text-muted-foreground">Jobs</p>
                    </div>
                    <div>
                      <p className="font-display font-bold">{service.seller.onTimeRate}%</p>
                      <p className="text-xs text-muted-foreground">On-Time</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
