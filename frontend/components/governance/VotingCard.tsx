'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Vote, CheckCircle, AlertCircle, Award, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Candidate, VoteTally } from '@/lib/types/api';

interface VotingCardProps {
  electionId: number;
  roleName: string;
  candidates: Candidate[];
  tallies: VoteTally[];
  userAddress: string;
  hasVoted?: boolean;
  votingWeight?: number;
  isActive?: boolean;
  onVoteSuccess?: () => void;
}

export function VotingCard({
  electionId,
  roleName,
  candidates,
  tallies,
  userAddress,
  hasVoted = false,
  votingWeight = 2,
  isActive = true,
  onVoteSuccess,
}: VotingCardProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get vote tally for a candidate
  const getTallyForCandidate = (candidateAddress: string): VoteTally | undefined => {
    return tallies.find(t => t.candidate === candidateAddress);
  };

  // Calculate total votes
  const totalVotes = tallies.reduce((sum, t) => sum + t.vote_count, 0);

  // Get vote percentage
  const getVotePercentage = (candidateAddress: string): number => {
    if (totalVotes === 0) return 0;
    const tally = getTallyForCandidate(candidateAddress);
    if (!tally) return 0;
    return (tally.vote_count / totalVotes) * 100;
  };

  // Get leading candidate
  const leadingCandidate = tallies.length > 0
    ? tallies.reduce((prev, current) =>
        (prev.vote_count > current.vote_count) ? prev : current
      ).candidate
    : null;

  const handleVote = async (candidateAddress: string) => {
    if (!isActive) {
      toast.error('Voting is closed for this election');
      return;
    }

    if (hasVoted) {
      toast.error('You have already voted in this election');
      return;
    }

    setSelectedCandidate(candidateAddress);
    setIsSubmitting(true);

    try {
      // TODO: Integrate with Aptos wallet and submit transaction
      // const payload = {
      //   type: 'entry_function_payload',
      //   function: 'nyu_aptos_builder_camp::governance::vote',
      //   type_arguments: [],
      //   arguments: [
      //     Array.from(new TextEncoder().encode(roleName)),
      //     electionId,
      //     candidateAddress,
      //     Math.floor(Date.now() / 1000), // current timestamp
      //   ],
      // };

      // Simulate transaction submission
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Vote submitted successfully!');
      onVoteSuccess?.();
    } catch (error) {
      console.error('Failed to submit vote:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
      setSelectedCandidate(null);
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

  if (candidates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Vote for {roleName}
          </CardTitle>
          <CardDescription>Election ID: {electionId}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No candidates have been nominated yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Vote for {roleName}
            </CardTitle>
            <CardDescription>
              Election ID: {electionId} • {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Active' : 'Closed'}
            </Badge>
            {hasVoted && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Voted
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voting Info */}
        <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-600">
              Your voting weight: <strong>{votingWeight}</strong>
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {totalVotes} total votes cast
          </span>
        </div>

        {/* Already Voted Message */}
        {hasVoted && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-600">
              You have already voted in this election. Results will be visible after voting closes.
            </p>
          </div>
        )}

        {/* Voting Closed Message */}
        {!isActive && !hasVoted && (
          <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <p className="text-sm text-orange-600">
              Voting has closed for this election.
            </p>
          </div>
        )}

        {/* Candidates */}
        <div className="space-y-3">
          {candidates.map((candidate) => {
            const tally = getTallyForCandidate(candidate.candidate);
            const percentage = getVotePercentage(candidate.candidate);
            const isLeading = leadingCandidate === candidate.candidate && totalVotes > 0;
            const voteCount = tally?.vote_count || 0;

            return (
              <div
                key={candidate.candidate}
                className={`p-4 border rounded-lg transition-all ${
                  isLeading ? 'border-primary bg-primary/5' : 'border-border'
                } ${hasVoted ? 'opacity-75' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10">
                      {getInitials(candidate.display_name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Candidate Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">
                        {candidate.display_name || 'Anonymous Candidate'}
                      </h4>
                      {isLeading && (
                        <Badge variant="default" className="gap-1">
                          <Award className="h-3 w-3" />
                          Leading
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {candidate.candidate.slice(0, 12)}...{candidate.candidate.slice(-8)}
                    </p>

                    {/* Vote Count & Progress Bar */}
                    {totalVotes > 0 && (
                      <div className="space-y-1 mb-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {voteCount} vote{voteCount !== 1 ? 's' : ''}
                          </span>
                          <span className="text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isLeading ? 'bg-primary' : 'bg-primary/50'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Vote Button */}
                    {isActive && !hasVoted && (
                      <Button
                        onClick={() => handleVote(candidate.candidate)}
                        disabled={isSubmitting}
                        variant={selectedCandidate === candidate.candidate ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                      >
                        {isSubmitting && selectedCandidate === candidate.candidate
                          ? 'Submitting Vote...'
                          : 'Vote for this Candidate'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
