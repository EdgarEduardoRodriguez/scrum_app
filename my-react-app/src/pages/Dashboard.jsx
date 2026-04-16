import React from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  BarChart3,
  Target,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  // Mock data
  const teamMembers = [
    { name: 'John Doe', role: 'Frontend Developer', status: 'active' },
    { name: 'Jane Smith', role: 'Backend Developer', status: 'active' },
    { name: 'Mike Johnson', role: 'Designer', status: 'away' },
    { name: 'Sarah Wilson', role: 'QA Engineer', status: 'active' },
  ];

  const recentActivity = [
    { action: 'Created new task', time: '2 hours ago' },
    { action: 'Completed sprint review', time: '4 hours ago' },
    { action: 'Updated project timeline', time: '1 day ago' },
    { action: 'Added new team member', time: '2 days ago' },
  ];

  const stats = [
    { label: 'Active Sprints', value: '3', icon: Calendar, color: 'text-primary' },
    { label: 'Team Members', value: '12', icon: Users, color: 'text-green-600' },
    { label: 'Tasks Completed', value: '45', icon: CheckCircle, color: 'text-purple-600' },
    { label: 'Velocity', value: '23.5', icon: TrendingUp, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your project and team</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-12 h-12 ${stat.color} bg-muted p-2 rounded-lg`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Sprints */}
        <div className="lg:col-span-2 bg-card p-6 rounded-lg shadow-sm border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Active Sprints</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-border rounded-lg">
              <div>
                <h3 className="font-medium text-foreground">Sprint 15</h3>
                <p className="text-sm text-muted-foreground">Authentication System</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>Start: Jan 15</span>
                  <span>End: Jan 29</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">78%</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50/50 border border-border rounded-lg">
              <div>
                <h3 className="font-medium text-foreground">Sprint 16</h3>
                <p className="text-sm text-muted-foreground">Dashboard Redesign</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>Start: Jan 29</span>
                  <span>End: Feb 12</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">12%</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Team Members</h2>
          <div className="space-y-3">
            {teamMembers.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <div>
                    <div className="font-medium text-foreground">{member.name}</div>
                    <div className="text-sm text-muted-foreground">{member.role}</div>
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                  <Activity className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-primary hover:text-primary/90 font-medium">
            View All Team Members
          </button>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">{activity.action}</span>
                </div>
                <span className="text-sm text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Overview */}
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Project Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="font-medium">Burndown Chart</span>
              </div>
              <button className="text-primary hover:text-primary/90">View</button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-green-600" />
                <span className="font-medium">Sprint Goals</span>
              </div>
              <button className="text-primary hover:text-primary/90">View</button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="font-medium">Time Tracking</span>
              </div>
              <button className="text-primary hover:text-primary/90">View</button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="font-medium">Blockers</span>
              </div>
              <button className="text-primary hover:text-primary/90">View</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;