'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Award, Medal, TrendingUp, Users, Calendar } from 'lucide-react';
import { Candidate, VoteTally, ElectionVote } from '@/lib/types/api';

interface ElectionResultsProps {
  electionId: number;
  roleName: string;
  candidates: Candidate[];
  tallies: VoteTally[];
  votes?: ElectionVote[];
  winner?: string;
  winnerName?: string;
  finalized: boolean;
  startDate: string;
  endDate: string;
  isLoading?: boolean;
}

export function ElectionResults({
  electionId,
  roleName,
  candidates,
  tallies,
  votes = [],
  winner,
  winnerName,
  finalized,
  startDate,
  endDate,
  isLoading = false,
}: ElectionResultsProps) {
  // Calculate total votes and weight
  const totalVotes = tallies.reduce((sum, t) => sum + t.vote_count, 0);
  const totalWeight = tallies.reduce((sum, t) => sum + parseInt(t.total_weight), 0);

  // Sort tallies by vote count (descending)
  const sortedTallies = [...tallies].sort((a, b) => b.vote_count - a.vote_count);

  // Get candidate info
  const getCandidateInfo = (address: string) => {
    return candidates.find(c => c.candidate === address);
  };

  // Get vote percentage
  const getVotePercentage = (voteCount: number): number => {
    if (totalVotes === 0) return 0;
    return (voteCount / totalVotes) * 100;
  };

  // Get medal component based on rank
  const getRankBadge = (index: number) => {
    if (index === 0 && finalized && winner) {
      return (
        <Badge variant="default" className="gap-1 bg-yellow-500 hover:bg-yellow-600">
          <Trophy className="h-3 w-3" />
          Winner
        </Badge>
      );
    }
    if (index === 1) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Medal className="h-3 w-3" />
          2nd
        </Badge>
      );
    }
    if (index === 2) {
      return (
        <Badge variant="outline" className="gap-1">
          <Medal className="h-3 w-3" />
          3rd
        </Badge>
      );
    }
    return null;
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Election Results
          </CardTitle>
          <CardDescription>Loading results...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
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
              <TrendingUp className="h-5 w-5" />
              Election Results: {roleName}
            </CardTitle>
            <CardDescription>
              Election ID: {electionId}
            </CardDescription>
          </div>
          <Badge variant={finalized ? 'default' : 'secondary'}>
            {finalized ? 'Finalized' : 'In Progress'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Election Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Candidates</span>
            </div>
            <p className="text-2xl font-bold">{candidates.length}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Votes</span>
            </div>
            <p className="text-2xl font-bold">{totalVotes}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Vote Weight</span>
            </div>
            <p className="text-2xl font-bold">{totalWeight}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Status</span>
            </div>
            <p className="text-sm font-semibold">
              {finalized ? 'Closed' : 'Active'}
            </p>
          </div>
        </div>

        {/* Winner Announcement */}
        {finalized && winner && (
          <div className="p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500 rounded-full">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Election Winner</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {winnerName || winner.slice(0, 12) + '...' + winner.slice(-8)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground">Vote Distribution</h4>
          {sortedTallies.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No votes have been cast yet.
            </p>
          ) : (
            sortedTallies.map((tally, index) => {
              const candidateInfo = getCandidateInfo(tally.candidate);
              const percentage = getVotePercentage(tally.vote_count);
              const isWinner = finalized && winner === tally.candidate;

              return (
                <div
                  key={tally.candidate}
                  className={`p-4 border rounded-lg transition-all ${
                    isWinner
                      ? 'border-yellow-500 bg-yellow-500/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Rank */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={isWinner ? 'bg-yellow-500 text-white' : 'bg-primary/10'}>
                        {getInitials(candidateInfo?.display_name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Candidate Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          {candidateInfo?.display_name || 'Anonymous Candidate'}
                        </h4>
                        {getRankBadge(index)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {tally.candidate.slice(0, 12)}...{tally.candidate.slice(-8)}
                      </p>

                      {/* Vote Stats */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {tally.vote_count} vote{tally.vote_count !== 1 ? 's' : ''} • Weight: {tally.total_weight}
                          </span>
                          <span className="font-semibold">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isWinner
                                ? 'bg-yellow-500'
                                : index === 0
                                ? 'bg-primary'
                                : 'bg-primary/50'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Election Period */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Started: {new Date(startDate).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Ended: {new Date(endDate).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Voter Details (if available) */}
        {votes && votes.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-sm text-muted-foreground mb-3">
              Recent Votes ({votes.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {votes.slice(0, 10).map((vote, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded text-xs"
                >
                  <span className="text-muted-foreground">
                    {vote.voter_name || vote.voter.slice(0, 8) + '...'}
                  </span>
                  <span className="font-medium">
                    → {getCandidateInfo(vote.candidate)?.display_name || vote.candidate.slice(0, 8) + '...'}
                  </span>
                  <span className="text-muted-foreground">
                    Weight: {vote.weight}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
