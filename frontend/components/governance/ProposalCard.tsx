'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  CheckCircle,
  Clock,
  User,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Proposal, ProposalVote } from '@/lib/types/api';

interface ProposalCardProps {
  proposal: Proposal;
  userAddress?: string;
  userVote?: ProposalVote | null;
  votingPower?: number;
  onVoteSuccess?: () => void;
}

export function ProposalCard({
  proposal,
  userAddress,
  userVote = null,
  votingPower = 2,
  onVoteSuccess,
}: ProposalCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVote, setSelectedVote] = useState<boolean | null>(null);

  // Use state for current time to ensure consistent SSR/client rendering
  // Initialize with endDate to assume ended state on server
  const [now, setNow] = useState<Date>(() => new Date(proposal.end_ts));

  // Update current time on client mount and periodically
  useEffect(() => {
    const updateTime = () => setNow(new Date());
    updateTime(); // Set immediately on mount

    // Update every minute to keep time remaining accurate
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate voting progress
  const totalVotes = parseInt(proposal.yay_votes) + parseInt(proposal.nay_votes);
  const yayPercentage = totalVotes > 0 ? (parseInt(proposal.yay_votes) / totalVotes) * 100 : 0;
  const nayPercentage = totalVotes > 0 ? (parseInt(proposal.nay_votes) / totalVotes) * 100 : 0;

  // Check if voting is active
  const startDate = new Date(proposal.start_ts);
  const endDate = new Date(proposal.end_ts);
  const isActive = now >= startDate && now < endDate && proposal.statusName === 'Active';
  const hasVoted = userVote !== null;

  // Calculate time remaining
  const getTimeRemaining = (): string => {
    if (now < startDate) {
      return 'Not started';
    }
    if (now >= endDate) {
      return 'Ended';
    }

    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  // Get status badge variant
  const getStatusVariant = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case 'active':
        return 'default';
      case 'passed':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'executed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleVote = async (vote: boolean) => {
    if (!isActive) {
      toast.error('Voting is closed for this proposal');
      return;
    }

    if (hasVoted) {
      toast.error('You have already voted on this proposal');
      return;
    }

    if (!userAddress) {
      toast.error('Please connect your wallet to vote');
      return;
    }

    setSelectedVote(vote);
    setIsSubmitting(true);

    try {
      // TODO: Integrate with Aptos wallet and submit transaction
      // const payload = {
      //   type: 'entry_function_payload',
      //   function: 'nyu_aptos_builder_camp::proposals::vote_on_proposal',
      //   type_arguments: [],
      //   arguments: [
      //     proposal.proposal_id,
      //     vote,
      //     Math.floor(Date.now() / 1000), // current timestamp
      //   ],
      // };

      // Simulate transaction submission
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success(`Vote ${vote ? 'YES' : 'NO'} submitted successfully!`);
      onVoteSuccess?.();
    } catch (error) {
      console.error('Failed to submit vote:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
      setSelectedVote(null);
    }
  };

  const getInitials = (name: string | undefined): string => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">#{proposal.proposal_id}</Badge>
              <Badge variant={getStatusVariant(proposal.statusName)}>
                {proposal.statusName}
              </Badge>
              {hasVoted && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Voted
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl">{proposal.title}</CardTitle>
            <CardDescription className="mt-2">
              {proposal.description}
            </CardDescription>
          </div>
        </div>

        {/* Creator Info */}
        <div className="flex items-center gap-2 pt-3 border-t">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-primary/10 text-xs">
              {getInitials(proposal.creator_name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            Proposed by{' '}
            <span className="font-medium">
              {proposal.creator_name || proposal.creator.slice(0, 8) + '...'}
            </span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Voting Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <ThumbsUp className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Yes Votes</span>
            </div>
            <p className="text-xl font-bold text-green-600">{proposal.voteStats.yayVoters}</p>
            <p className="text-xs text-muted-foreground">Weight: {proposal.yay_votes}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <ThumbsDown className="h-4 w-4 text-red-600" />
              <span className="text-xs text-muted-foreground">No Votes</span>
            </div>
            <p className="text-xl font-bold text-red-600">{proposal.voteStats.nayVoters}</p>
            <p className="text-xs text-muted-foreground">Weight: {proposal.nay_votes}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Voters</span>
            </div>
            <p className="text-xl font-bold">{proposal.voteStats.totalVoters}</p>
          </div>
        </div>

        {/* Vote Distribution */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vote Distribution</span>
            <span className="text-muted-foreground">
              {yayPercentage > nayPercentage ? 'Passing' : 'Failing'}
            </span>
          </div>

          {/* Yes Votes Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-green-600 font-medium">Yes</span>
              <span className="text-green-600">{yayPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${yayPercentage}%` }}
              />
            </div>
          </div>

          {/* No Votes Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-red-600 font-medium">No</span>
              <span className="text-red-600">{nayPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: `${nayPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Time Remaining */}
        <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-600">{getTimeRemaining()}</span>
          </div>
          {votingPower > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600">
                Your voting power: <strong>{votingPower}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Already Voted Message */}
        {hasVoted && userVote && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-600">
              You voted <strong>{userVote.vote ? 'YES' : 'NO'}</strong> on this proposal
              (Weight: {userVote.weight})
            </p>
          </div>
        )}

        {/* Voting Closed Message */}
        {!isActive && !hasVoted && (
          <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <p className="text-sm text-orange-600">
              Voting has closed for this proposal.
            </p>
          </div>
        )}

        {/* Voting Buttons */}
        {isActive && !hasVoted && userAddress && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleVote(true)}
              disabled={isSubmitting}
              variant={selectedVote === true ? 'default' : 'outline'}
              className="gap-2"
            >
              <ThumbsUp className="h-4 w-4" />
              {isSubmitting && selectedVote === true ? 'Voting...' : 'Vote Yes'}
            </Button>
            <Button
              onClick={() => handleVote(false)}
              disabled={isSubmitting}
              variant={selectedVote === false ? 'destructive' : 'outline'}
              className="gap-2"
            >
              <ThumbsDown className="h-4 w-4" />
              {isSubmitting && selectedVote === false ? 'Voting...' : 'Vote No'}
            </Button>
          </div>
        )}

        {/* Connect Wallet Message */}
        {isActive && !hasVoted && !userAddress && (
          <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <p className="text-sm text-orange-600">
              Please connect your wallet to vote on this proposal.
            </p>
          </div>
        )}

        {/* Dates */}
        <div className="flex justify-between text-xs text-muted-foreground pt-3 border-t">
          <span>Start: {new Date(proposal.start_ts).toLocaleString()}</span>
          <span>End: {new Date(proposal.end_ts).toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
