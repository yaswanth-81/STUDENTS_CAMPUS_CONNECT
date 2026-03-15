import { Star, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface ServiceCardProps {
  id: string;
  title: string;
  seller: { name: string; college: string; rating: number; reviews: number };
  price: number;
  deliveryDays: number;
  category: string;
  index?: number;
}

export function ServiceCard({ id, title, seller, price, deliveryDays, category, index = 0 }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Link to={`/service/${id}`} className="block">
        <div className="rounded-lg bg-card card-shadow border border-border overflow-hidden group hover:card-shadow-hover transition-shadow duration-300">
          <div className="h-36 hero-gradient flex items-center justify-center relative overflow-hidden">
            <span className="text-3xl font-display font-bold gradient-text opacity-30 group-hover:opacity-50 transition-opacity">
              {category.toUpperCase()}
            </span>
            <Badge className="absolute top-3 right-3 bg-card text-foreground border-border text-xs">
              {category}
            </Badge>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground">
                {seller.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{seller.name}</p>
                <p className="text-xs text-muted-foreground truncate">{seller.college}</p>
              </div>
            </div>
            <h3 className="font-display font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">{seller.rating}</span>
                <span>({seller.reviews})</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{deliveryDays}d</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Starting at </span>
              <span className="font-display font-bold text-sm">₹{price}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
