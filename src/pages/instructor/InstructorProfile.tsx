import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Edit, Star, Mail, Phone, MapPin, BookOpen, Users, Clock, FileCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import axios from '@/lib/axios';

// Mock data as fallback if API fails
const mockProfileData = {
  id: '1234',
  name: 'Dr. Jane Smith',
  role: 'Senior Instructor',
  email: 'jane.smith@example.com',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  specialty: 'Web Development',
  experience: 8,
  bio: 'Passionate educator with 8+ years of experience in web development and computer science. Specialized in frontend frameworks and interactive learning.',
  profileCompletion: 85,
  totalStudents: 432,
  totalCourses: 6,
  averageRating: 4.8,
  recentReviews: [
    { student: 'Alex P.', rating: 5, comment: 'Excellent teaching style!', date: '3 days ago' },
    { student: 'Morgan T.', rating: 4, comment: 'Very knowledgeable and helpful.', date: '1 week ago' },
  ],
  teachingHours: 320,
  avatar: null,
  socialLinks: {
    linkedin: 'https://linkedin.com/in/janesmith',
    twitter: 'https://twitter.com/janesmith',
    website: 'https://janesmith.dev'
  }
};

// Form schema
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  role: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
  location: z.string().optional(),
  specialty: z.string().min(2, {
    message: "Specialty must be at least 2 characters.",
  }),
  experience: z.coerce.number().min(0),
  bio: z.string().max(500, {
    message: "Bio cannot exceed 500 characters."
  }),
  linkedin: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal('')),
  twitter: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal('')),
  website: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal('')),
});

const InstructorProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState(mockProfileData);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Initialize form with profile data
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profileData.name,
      role: profileData.role,
      email: profileData.email,
      phone: profileData.phone,
      location: profileData.location,
      specialty: profileData.specialty,
      experience: profileData.experience,
      bio: profileData.bio,
      linkedin: profileData.socialLinks.linkedin,
      twitter: profileData.socialLinks.twitter,
      website: profileData.socialLinks.website,
    },
  });

  // Fetch instructor profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would fetch from the API
        // Simulating API call with setTimeout
        setTimeout(() => {
          // Use user data from auth context if available, otherwise use mock data
          if (user) {
            setProfileData({
              ...mockProfileData,
              name: user.name || mockProfileData.name,
              email: user.email || mockProfileData.email,
            });
          }
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        
        toast({
          title: 'Error',
          description: 'Failed to load profile data from server. Using cached data instead.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  // Update form values when profile data changes
  useEffect(() => {
    form.reset({
      name: profileData.name,
      role: profileData.role,
      email: profileData.email,
      phone: profileData.phone,
      location: profileData.location,
      specialty: profileData.specialty,
      experience: profileData.experience,
      bio: profileData.bio,
      linkedin: profileData.socialLinks.linkedin,
      twitter: profileData.socialLinks.twitter,
      website: profileData.socialLinks.website,
    });
  }, [profileData, form]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    try {
      setIsLoading(true);
      
      // In a real app, this would send to the API
      // For now, just simulate an API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state with form values
      setProfileData({
        ...profileData,
        name: values.name,
        role: values.role || profileData.role,
        email: values.email,
        phone: values.phone || '',
        location: values.location || '',
        specialty: values.specialty,
        experience: values.experience,
        bio: values.bio || '',
        socialLinks: {
          linkedin: values.linkedin || '',
          twitter: values.twitter || '',
          website: values.website || '',
        }
      });
      
      setIsEditing(false);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl text-[#3F2B96]">Instructor Profile</CardTitle>
              <CardDescription>Manage your instructor profile and information</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="border-[#3F2B96] text-[#3F2B96] hover:bg-[#3F2B96]/5">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Basic info */}
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  {profileData.avatar ? (
                    <AvatarImage src={profileData.avatar} alt={profileData.name} />
                  ) : (
                    <AvatarFallback className="text-lg bg-[#3F2B96] text-white">
                      {getInitials(profileData.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="text-center">
                  <h3 className="font-semibold text-xl text-[#3F2B96]">{profileData.name}</h3>
                  <p className="text-muted-foreground">{profileData.role}</p>
                </div>
                
                <div className="w-full">
                  <p className="text-sm text-muted-foreground mb-1 flex justify-between">
                    <span>Profile Completion</span>
                    <span>{profileData.profileCompletion}%</span>
                  </p>
                  <Progress value={profileData.profileCompletion} className="h-2 bg-gray-200" indicatorClassName="bg-[#3F2B96]" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-[#3F2B96]" />
                  <span>{profileData.email}</span>
                </div>
                
                {profileData.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-[#3F2B96]" />
                    <span>{profileData.phone}</span>
                  </div>
                )}
                
                {profileData.location && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-[#3F2B96]" />
                    <span>{profileData.location}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2 text-[#3F2B96]">Specialty</h4>
                <Badge variant="outline" className="bg-[#3F2B96]/5 text-[#3F2B96] border-[#3F2B96]/20">{profileData.specialty}</Badge>
                <div className="flex items-center mt-2 text-sm">
                  <Clock className="h-4 w-4 mr-2 text-[#3F2B96]" />
                  <span>{profileData.experience} Years Experience</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2 text-[#3F2B96]">Social Profiles</h4>
                <div className="space-y-2">
                  {profileData.socialLinks.linkedin && (
                    <a href={profileData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-[#3F2B96] hover:underline text-sm flex items-center">
                      LinkedIn Profile
                    </a>
                  )}
                  {profileData.socialLinks.twitter && (
                    <a href={profileData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-[#3F2B96] hover:underline text-sm flex items-center">
                      Twitter Profile
                    </a>
                  )}
                  {profileData.socialLinks.website && (
                    <a href={profileData.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-[#3F2B96] hover:underline text-sm flex items-center">
                      Personal Website
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            {/* Middle column - Bio and stats */}
            <div className="space-y-6 md:col-span-2">
              <div>
                <h4 className="text-sm font-medium mb-2 text-[#3F2B96]">Bio</h4>
                <p className="text-sm text-muted-foreground">{profileData.bio}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-[#3F2B96]/5 border-[#3F2B96]/20">
                  <CardContent className="p-4 flex items-center">
                    <BookOpen className="h-8 w-8 text-[#3F2B96] mr-4" />
                    <div>
                      <p className="text-2xl font-semibold">{profileData.totalCourses}</p>
                      <p className="text-xs text-muted-foreground">Courses Created</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#3F2B96]/5 border-[#3F2B96]/20">
                  <CardContent className="p-4 flex items-center">
                    <Users className="h-8 w-8 text-[#3F2B96] mr-4" />
                    <div>
                      <p className="text-2xl font-semibold">{profileData.totalStudents}</p>
                      <p className="text-xs text-muted-foreground">Total Students</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#3F2B96]/5 border-[#3F2B96]/20">
                  <CardContent className="p-4 flex items-center">
                    <Clock className="h-8 w-8 text-[#3F2B96] mr-4" />
                    <div>
                      <p className="text-2xl font-semibold">{profileData.teachingHours}</p>
                      <p className="text-xs text-muted-foreground">Teaching Hours</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center text-[#3F2B96]">
                  <Star className="h-4 w-4 mr-2 text-[#3F2B96]" />
                  <span>Instructor Rating: {profileData.averageRating}/5.0</span>
                </h4>
                
                <div className="space-y-3">
                  {profileData.recentReviews.map((review, index) => (
                    <Card key={index} className="bg-gray-50">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-sm">{review.student}</p>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                            <span className="text-sm">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-1">{review.date}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle className="text-[#3F2B96]">Edit Profile</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="focus-visible:ring-[#3F2B96]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role / Title</FormLabel>
                      <FormControl>
                        <Input {...field} className="focus-visible:ring-[#3F2B96]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" className="focus-visible:ring-[#3F2B96]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} className="focus-visible:ring-[#3F2B96]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} className="focus-visible:ring-[#3F2B96]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialty</FormLabel>
                      <FormControl>
                        <Input {...field} className="focus-visible:ring-[#3F2B96]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" className="focus-visible:ring-[#3F2B96]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="min-h-[120px] focus-visible:ring-[#3F2B96]" 
                        placeholder="Tell students about yourself, your experience, and teaching style"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-[#3F2B96]">Social Media Links</h4>
                
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://linkedin.com/in/username" className="focus-visible:ring-[#3F2B96]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://twitter.com/username" className="focus-visible:ring-[#3F2B96]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal Website</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://yourwebsite.com" className="focus-visible:ring-[#3F2B96]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  className="border-[#3F2B96] text-[#3F2B96] hover:bg-[#3F2B96]/5"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-[#3F2B96] hover:bg-[#5b44ad] text-white"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstructorProfile;
