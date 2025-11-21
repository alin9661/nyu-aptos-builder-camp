'use client';

import { Organization } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Building2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/components/ui/toast';

interface OrganizationCardProps {
  organization: Organization;
  onRequestJoin?: (organizationId: string) => void;
  onView?: (organizationId: string) => void;
}

export function OrganizationCard({ organization, onRequestJoin, onView }: OrganizationCardProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAction = async () => {
    if (organization.hasAccess) {
      onView?.(organization.id);
      // Navigate to organization detail page
      window.location.href = `/organizations/${organization.id}`;
    } else {
      setIsRequesting(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        onRequestJoin?.(organization.id);
        toast.success('Request sent!', {
          description: `Your request to join ${organization.name} has been submitted.`,
        });
      } catch (error) {
        toast.error('Failed to send request', {
          description: 'Please try again later.',
        });
      } finally {
        setIsRequesting(false);
      }
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {organization.logo ? (
              <img
                src={organization.logo}
                alt={`${organization.name} logo`}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                {organization.name}
              </CardTitle>
              {organization.hasAccess && (
                <Badge variant="default" className="mt-1">
                  Member
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <CardDescription className="text-sm line-clamp-3">
          {organization.description}
        </CardDescription>

        {organization.memberCount && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{organization.memberCount} members</span>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleAction}
          disabled={isRequesting}
          variant={organization.hasAccess ? 'default' : 'outline'}
          className="w-full"
        >
          {isRequesting ? 'Sending...' : organization.hasAccess ? 'View' : 'Request to Join'}
        </Button>
      </CardFooter>
    </Card>
  );
}
