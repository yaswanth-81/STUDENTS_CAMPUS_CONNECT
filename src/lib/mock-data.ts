export const CATEGORIES = [
  { id: "assignment", name: "Assignment Writing", icon: "FileText", color: "primary" },
  { id: "resume", name: "Resume Building", icon: "FileCheck", color: "secondary" },
  { id: "notes", name: "Record Writing", icon: "BookOpen", color: "accent" },
  { id: "miniproject", name: "Mini Project Help", icon: "Rocket", color: "primary" },
] as const;

export const FEATURED_SERVICES = [
  {
    id: "1",
    title: "Professional PPT Design – 15+ Slides",
    description: "I will create stunning, professional PowerPoint presentations with modern designs, custom animations, and infographics. Perfect for academic presentations, project demos, and seminars. Each slide is crafted with attention to detail ensuring your content stands out.",
    seller: { name: "Arjun K.", college: "JNTUA", department: "CSE", year: "3rd Year", avatar: "", rating: 4.9, reviews: 42, completedJobs: 56, onTimeRate: 98 },
    price: 499,
    deliveryDays: 2,
    category: "ppt",
    tags: ["PowerPoint", "Design", "Presentations", "Infographics"],
    portfolio: [
      { title: "Corporate Presentation", image: "" },
      { title: "Academic Seminar", image: "" },
      { title: "Startup Pitch Deck", image: "" },
    ],
  },
  {
    id: "2",
    title: "Full-Stack Mini Project (React + Node)",
    description: "Complete mini project development with React frontend and Node.js backend. Includes database design, API development, authentication, and deployment-ready code. Perfect for final year projects and portfolio building.",
    seller: { name: "Priya S.", college: "VJIT", department: "IT", year: "4th Year", avatar: "", rating: 4.8, reviews: 31, completedJobs: 38, onTimeRate: 95 },
    price: 2999,
    deliveryDays: 7,
    category: "miniproject",
    tags: ["React", "Node.js", "MongoDB", "Full-Stack"],
    portfolio: [
      { title: "E-Commerce Dashboard", image: "" },
      { title: "Chat Application", image: "" },
    ],
  },
  {
    id: "3",
    title: "ATS-Friendly Resume & Cover Letter",
    description: "Professional resume writing service optimized for Applicant Tracking Systems. I'll craft a compelling resume highlighting your skills and achievements, plus a tailored cover letter. Includes LinkedIn profile optimization tips.",
    seller: { name: "Rahul M.", college: "SVNIT", department: "ECE", year: "4th Year", avatar: "", rating: 5.0, reviews: 67, completedJobs: 89, onTimeRate: 100 },
    price: 299,
    deliveryDays: 1,
    category: "resume",
    tags: ["Resume", "Cover Letter", "ATS", "LinkedIn"],
    portfolio: [
      { title: "Tech Resume", image: "" },
      { title: "MBA Resume", image: "" },
      { title: "Fresher Resume", image: "" },
      { title: "Experienced Resume", image: "" },
    ],
  },
  {
    id: "4",
    title: "Complete Assignment – Any Subject",
    description: "Get well-researched, plagiarism-free assignments on any subject. I cover engineering, management, arts, and science subjects. Proper formatting, citations, and timely delivery guaranteed.",
    seller: { name: "Meera D.", college: "Vel Tech", department: "MBA", year: "2nd Year", avatar: "", rating: 4.7, reviews: 55, completedJobs: 72, onTimeRate: 94 },
    price: 199,
    deliveryDays: 1,
    category: "assignment",
    tags: ["Assignment", "Research", "Writing", "Academic"],
    portfolio: [],
  },
  {
    id: "5",
    title: "Logo & Brand Identity Package",
    description: "Complete brand identity design including logo, color palette, typography selection, and brand guidelines document. I create unique, memorable logos that represent your brand perfectly.",
    seller: { name: "Karthik R.", college: "DSU Campus 1", department: "Design", year: "3rd Year", avatar: "", rating: 4.9, reviews: 23, completedJobs: 31, onTimeRate: 97 },
    price: 799,
    deliveryDays: 3,
    category: "design",
    tags: ["Logo", "Branding", "Identity", "Design"],
    portfolio: [
      { title: "Tech Startup Logo", image: "" },
      { title: "Restaurant Branding", image: "" },
      { title: "NGO Identity", image: "" },
    ],
  },
  {
    id: "6",
    title: "Data Structures & Algorithms Tutoring",
    description: "One-on-one tutoring sessions for DSA concepts. I'll help you understand arrays, linked lists, trees, graphs, dynamic programming, and more. Includes practice problems and interview preparation tips.",
    seller: { name: "Sneha P.", college: "JNTUA", department: "CSE", year: "4th Year", avatar: "", rating: 4.6, reviews: 18, completedJobs: 24, onTimeRate: 92 },
    price: 399,
    deliveryDays: 2,
    category: "coding",
    tags: ["DSA", "Tutoring", "Algorithms", "Interview Prep"],
    portfolio: [],
  },
];

export const TESTIMONIALS = [
  { name: "Vikram S.", college: "VJIT", text: "Got my mini project done in 3 days. The quality was amazing and the student was super helpful!", rating: 5 },
  { name: "Ananya R.", college: "JNTUA", text: "Best platform for college students. Found an incredible PPT designer from my own campus.", rating: 5 },
  { name: "Ravi K.", college: "SVNIT", text: "Earned ₹15,000 last month helping peers with coding assignments. Love this platform!", rating: 5 },
];

export const MOCK_ORDERS = [
  { id: "ORD001", buyer: "Amit T.", title: "Java Assignment – OOP Concepts", deadline: "2026-03-18", status: "active" as const, price: 299 },
  { id: "ORD002", buyer: "Priyanka V.", title: "Machine Learning PPT – 20 Slides", deadline: "2026-03-20", status: "pending" as const, price: 599 },
  { id: "ORD003", buyer: "Suresh R.", title: "Resume + LinkedIn Optimization", deadline: "2026-03-15", status: "completed" as const, price: 499 },
  { id: "ORD004", buyer: "Divya M.", title: "React Dashboard UI", deadline: "2026-03-22", status: "active" as const, price: 1999 },
];

export const MOCK_MESSAGES = [
  {
    id: "c1",
    user: "Amit T.",
    lastMessage: "Can you start the assignment today?",
    time: "2 min ago",
    unread: 2,
    messages: [
      { id: "m1", sender: "them", text: "Hi! I need help with my Java OOP assignment.", time: "10:30 AM" },
      { id: "m2", sender: "me", text: "Sure! Can you share the requirements?", time: "10:32 AM" },
      { id: "m3", sender: "them", text: "Can you start the assignment today?", time: "10:35 AM" },
    ],
  },
  {
    id: "c2",
    user: "Priyanka V.",
    lastMessage: "Thanks! The PPT looks great.",
    time: "1 hr ago",
    unread: 0,
    messages: [
      { id: "m4", sender: "them", text: "Thanks! The PPT looks great.", time: "9:20 AM" },
    ],
  },
];

export const MOCK_REVIEWS = [
  { id: "r1", reviewer: "Amit T.", rating: 5, comment: "Excellent work! Delivered before the deadline and the quality was outstanding. Will definitely order again.", date: "2 days ago", avatar: "A" },
  { id: "r2", reviewer: "Sneha P.", rating: 5, comment: "Very professional and responsive. The PPT design was exactly what I needed for my seminar.", date: "1 week ago", avatar: "S" },
  { id: "r3", reviewer: "Vikram S.", rating: 4, comment: "Good work overall. Communication could be slightly better but the final output was great.", date: "2 weeks ago", avatar: "V" },
  { id: "r4", reviewer: "Divya M.", rating: 5, comment: "Amazing attention to detail. The code was clean, well-documented, and worked perfectly.", date: "3 weeks ago", avatar: "D" },
  { id: "r5", reviewer: "Ravi K.", rating: 5, comment: "Best resume writer on the platform! Got interview calls within a week of updating my resume.", date: "1 month ago", avatar: "R" },
];

export const MOCK_NOTIFICATIONS = [
  { id: "n1", type: "order" as const, title: "New Order Received", message: "Amit T. placed an order for Java Assignment", time: "5 min ago", read: false },
  { id: "n2", type: "message" as const, title: "New Message", message: "Priyanka V. sent you a message about PPT design", time: "30 min ago", read: false },
  { id: "n3", type: "update" as const, title: "Order Completed", message: "Your order ORD003 has been marked as completed", time: "2 hours ago", read: true },
  { id: "n4", type: "system" as const, title: "Profile Verified", message: "Your college email has been verified successfully", time: "1 day ago", read: true },
  { id: "n5", type: "order" as const, title: "Order Update", message: "Divya M. requested a revision on React Dashboard UI", time: "1 day ago", read: true },
  { id: "n6", type: "system" as const, title: "Weekly Summary", message: "You earned ₹3,200 this week. Keep it up!", time: "2 days ago", read: true },
  { id: "n7", type: "message" as const, title: "New Message", message: "Suresh R. left a review on your service", time: "3 days ago", read: true },
];

export const MOCK_JOBS = [
  { id: "j1", title: "Need React Dashboard for College Project", description: "Looking for someone to build a responsive admin dashboard using React and Tailwind CSS. Must include charts, tables, and user management.", budget: 2500, deadline: "2026-03-25", postedBy: "Amit T.", college: "JNTUA", category: "coding", applications: 5, postedDate: "2 days ago" },
  { id: "j2", title: "PPT for Machine Learning Seminar – 25 Slides", description: "Need a professional PowerPoint presentation on Machine Learning concepts. Should include diagrams, flowcharts, and modern design.", budget: 600, deadline: "2026-03-20", postedBy: "Priyanka V.", college: "VJIT", category: "ppt", applications: 3, postedDate: "3 days ago" },
  { id: "j3", title: "Logo Design for College Fest", description: "Design a creative and vibrant logo for our annual college tech fest 'TechnoVista 2026'. Should be modern and appealing to young audience.", budget: 800, deadline: "2026-03-30", postedBy: "Ravi K.", college: "SVNIT", category: "design", applications: 8, postedDate: "1 day ago" },
  { id: "j4", title: "Physics Assignment – Quantum Mechanics", description: "Complete assignment on quantum mechanics topics including wave-particle duality, Schrödinger equation, and quantum tunneling. 15 questions.", budget: 300, deadline: "2026-03-18", postedBy: "Meera D.", college: "Vel Tech", category: "assignment", applications: 2, postedDate: "5 hours ago" },
  { id: "j5", title: "Resume Review and Optimization", description: "Review my current resume and optimize it for software engineering roles. Need ATS-friendly format with strong action verbs.", budget: 200, deadline: "2026-03-22", postedBy: "Karthik R.", college: "DSU Campus 1", category: "resume", applications: 4, postedDate: "4 days ago" },
  { id: "j6", title: "Android App for Attendance Tracking", description: "Build a simple Android app for tracking class attendance. Should have QR code scanning, student list, and export to CSV features.", budget: 3500, deadline: "2026-04-05", postedBy: "Sneha P.", college: "JNTUA", category: "miniproject", applications: 6, postedDate: "1 week ago" },
];

export const MOCK_PORTFOLIO = [
  { id: "p1", title: "E-Commerce Dashboard", description: "A responsive admin dashboard built with React and Tailwind CSS featuring analytics, order management, and user controls.", tags: ["React", "Tailwind", "Dashboard"], link: "https://example.com" },
  { id: "p2", title: "College Fest Website", description: "Designed and developed the official website for TechnoVista 2025, featuring event registration and live updates.", tags: ["Next.js", "UI/UX", "Web Design"], link: "https://example.com" },
  { id: "p3", title: "Weather App", description: "A clean weather application with location-based forecasts, animated weather icons, and 7-day predictions.", tags: ["React", "API", "Mobile-First"], link: "" },
  { id: "p4", title: "Brand Identity – CafeBloom", description: "Complete brand identity package including logo, business cards, menu design, and social media templates.", tags: ["Branding", "Logo", "Print Design"], link: "" },
  { id: "p5", title: "ML Model – Sentiment Analysis", description: "Built a sentiment analysis model using Python and NLTK for analyzing product reviews with 92% accuracy.", tags: ["Python", "ML", "NLP"], link: "https://github.com" },
  { id: "p6", title: "Student Notes Platform", description: "A collaborative notes sharing platform for college students with subject-wise organization and search functionality.", tags: ["Node.js", "MongoDB", "Full-Stack"], link: "" },
];
