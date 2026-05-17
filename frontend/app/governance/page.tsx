'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Vote,
  Plus,
  TrendingUp,
  Calendar,
  Award,
  FileCheck,
  History,
  Users,
} from 'lucide-react';
import { ElectionForm } from '@/components/governance/ElectionForm';
import { VotingCard } from '@/components/governance/VotingCard';
import { ElectionResults } from '@/components/governance/ElectionResults';
import { ProposalCard } from '@/components/governance/ProposalCard';
import { useElections, useGovernanceStats } from '@/hooks/useGovernance';
import { useActiveProposals } from '@/hooks/useProposals';
import { Election } from '@/lib/types/api';

export default function GovernancePage() {
  const [showElectionForm, setShowElectionForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState('active');
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [votingPower, setVotingPower] = useState(2); // Default: e-board member weight

  // Stabilize filter objects to prevent infinite re-renders
  const electionFilters = useMemo(() => ({
    page: 1,
    limit: 50,
    sort: 'desc' as const,
  }), []);

  // Fetch governance data
  const { data: statsData, loading: statsLoading } = useGovernanceStats(true, 60000);
  const { data: electionsData, loading: electionsLoading, refetch: refetchElections } = useElections(electionFilters);
  const { data: proposalsData, loading: proposalsLoading, refetch: refetchProposals } = useActiveProposals(true, 30000);

  // TODO: Replace with actual wallet integration
  useEffect(() => {
    // Simulate wallet connection
    const mockUserAddress = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    setUserAddress(mockUserAddress);

    // TODO: Check if user is admin by calling governance contract
    // const adminAddress = await getAdminAddress();
    // setIsAdmin(mockUserAddress === adminAddress);

    // TODO: Calculate user's voting power based on role
    // - Admin: special privileges
    // - Advisor: weight = 3
    // - E-board: weight = 2
    // - Others: not eligible
  }, []);

  // Separate elections by status
  const activeElections = electionsData?.elections.filter(
    (e) => !e.finalized && new Date(e.end_ts) > new Date()
  ) || [];

  const upcomingElections = electionsData?.elections.filter(
    (e) => !e.finalized && new Date(e.start_ts) > new Date()
  ) || [];

  const pastElections = electionsData?.elections.filter(
    (e) => e.finalized || new Date(e.end_ts) <= new Date()
  ) || [];

  const handleElectionFormSuccess = () => {
    setShowElectionForm(false);
    refetchElections();
  };

  const handleVoteSuccess = () => {
    refetchElections();
  };

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Page Header */}
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                      <Vote className="h-8 w-8" />
                      Governance
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      Vote on elections and proposals to shape the club's future
                    </p>
                  </div>
                  {isAdmin && !showElectionForm && (
                    <Button onClick={() => setShowElectionForm(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Election
                    </Button>
                  )}
                </div>

                {/* Stats Overview */}
                {statsLoading ? (
                  <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-16 w-full" />
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : statsData ? (
                  <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Elections</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statsData.elections.total}</div>
                        <p className="text-xs text-muted-foreground">
                          {statsData.elections.active} active
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statsData.votes.uniqueVoters}</div>
                        <p className="text-xs text-muted-foreground">
                          {statsData.votes.totalVotes} votes cast
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Finalized</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statsData.elections.finalized}</div>
                        <p className="text-xs text-muted-foreground">
                          {statsData.elections.rolesWithElections} roles
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vote Weight</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statsData.votes.totalWeight}</div>
                        <p className="text-xs text-muted-foreground">Cumulative</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}
              </div>

              {/* Election Form (Admin Only) */}
              {showElectionForm && (
                <div className="px-4 lg:px-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Create New Election</h2>
                    <Button variant="outline" onClick={() => setShowElectionForm(false)}>
                      Cancel
                    </Button>
                  </div>
                  <ElectionForm
                    isAdmin={isAdmin}
                    adminAddress={userAddress || undefined}
                    onSuccess={handleElectionFormSuccess}
                  />
                </div>
              )}

              {/* Main Content Tabs */}
              <div className="px-4 lg:px-6">
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="active" className="gap-2">
                      <Vote className="h-4 w-4" />
                      Active Elections
                      {activeElections.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {activeElections.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="upcoming" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      Upcoming
                      {upcomingElections.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {upcomingElections.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="past" className="gap-2">
                      <History className="h-4 w-4" />
                      Past Elections
                    </TabsTrigger>
                    <TabsTrigger value="proposals" className="gap-2">
                      <FileCheck className="h-4 w-4" />
                      Active Proposals
                      {proposalsData && proposalsData.count > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {proposalsData.count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Active Elections */}
                  <TabsContent value="active" className="mt-6 space-y-6">
                    {electionsLoading ? (
                      <Skeleton className="h-96 w-full" />
                    ) : activeElections.length === 0 ? (
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-center text-muted-foreground">
                            No active elections at the moment.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      activeElections.map((election) => (
                        <VotingCard
                          key={`${election.election_id}-${election.role_name}`}
                          electionId={election.election_id}
                          roleName={election.role_name}
                          candidates={election.candidates}
                          tallies={election.tallies}
                          userAddress={userAddress || ''}
                          votingWeight={votingPower}
                          isActive={true}
                          onVoteSuccess={handleVoteSuccess}
                        />
                      ))
                    )}
                  </TabsContent>

                  {/* Upcoming Elections */}
                  <TabsContent value="upcoming" className="mt-6 space-y-6">
                    {electionsLoading ? (
                      <Skeleton className="h-96 w-full" />
                    ) : upcomingElections.length === 0 ? (
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-center text-muted-foreground">
                            No upcoming elections scheduled.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      upcomingElections.map((election) => (
                        <Card key={`${election.election_id}-${election.role_name}`}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle>{election.role_name}</CardTitle>
                                <CardDescription>
                                  Election ID: {election.election_id}
                                </CardDescription>
                              </div>
                              <Badge variant="secondary">Upcoming</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Starts: {new Date(election.start_ts).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{election.candidates.length} candidates registered</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  {/* Past Elections */}
                  <TabsContent value="past" className="mt-6 space-y-6">
                    {electionsLoading ? (
                      <Skeleton className="h-96 w-full" />
                    ) : pastElections.length === 0 ? (
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-center text-muted-foreground">
                            No past elections to display.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      pastElections.map((election) => (
                        <ElectionResults
                          key={`${election.election_id}-${election.role_name}`}
                          electionId={election.election_id}
                          roleName={election.role_name}
                          candidates={election.candidates}
                          tallies={election.tallies}
                          winner={election.winner}
                          winnerName={election.winner_name}
                          finalized={election.finalized}
                          startDate={election.start_ts}
                          endDate={election.end_ts}
                        />
                      ))
                    )}
                  </TabsContent>

                  {/* Active Proposals */}
                  <TabsContent value="proposals" className="mt-6 space-y-6">
                    {proposalsLoading ? (
                      <Skeleton className="h-96 w-full" />
                    ) : !proposalsData || proposalsData.proposals.length === 0 ? (
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-center text-muted-foreground">
                            No active proposals at the moment.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      proposalsData.proposals.map((proposal) => (
                        <ProposalCard
                          key={proposal.proposal_id}
                          proposal={proposal}
                          userAddress={userAddress || undefined}
                          votingPower={votingPower}
                          onVoteSuccess={refetchProposals}
                        />
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
