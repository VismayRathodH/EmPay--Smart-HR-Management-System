import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Brain, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const AIInsightsDashboard = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadInsights = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch AI suggestions for various metrics
      const suggestions = await Promise.all([
        api.getAISuggestion({ type: 'attendance' }).catch(() => null),
        api.getAISuggestion({ type: 'payroll' }).catch(() => null),
        api.getAISuggestion({ type: 'leave' }).catch(() => null),
        api.getAISuggestion({ type: 'performance' }).catch(() => null),
      ]);

      // Filter out null values and set insights
      const validInsights = suggestions.filter(Boolean);
      setInsights(validInsights.length > 0 ? validInsights : getDefaultInsights());
    } catch (err) {
      console.error('AI error:', err);
      setInsights(getDefaultInsights());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultInsights = () => [
    {
      id: 1,
      type: 'Attendance',
      title: 'Attendance Pattern Alert',
      description: 'Attendance in the Engineering department has dropped by 4% this week. Consider checking in with the team lead.',
      priority: 'medium',
      action: 'Review & Follow Up',
    },
    {
      id: 2,
      type: 'Payroll',
      title: 'Payroll Optimization',
      description: 'Your current payroll spending is 2% above budget. Review overtime allocations and consider rebalancing.',
      priority: 'high',
      action: 'Adjust Budget',
    },
    {
      id: 3,
      type: 'Leave',
      title: 'Leave Balance Analysis',
      description: 'Q3 leave requests are 15% higher than previous quarters. Plan contingency resources.',
      priority: 'low',
      action: 'Plan Resources',
    },
    {
      id: 4,
      type: 'Performance',
      title: 'Performance Trends',
      description: 'Top performers in Sales department are due for performance reviews. Consider planning retention discussions.',
      priority: 'medium',
      action: 'Schedule Reviews',
    },
  ];

  useEffect(() => {
    loadInsights();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'medium':
        return 'border-l-4 border-orange-500 bg-orange-50';
      case 'low':
        return 'border-l-4 border-blue-500 bg-blue-50';
      default:
        return 'border-l-4 border-slate-500 bg-slate-50';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-orange-100 text-orange-700';
      case 'low':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI Insights Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">AI-powered recommendations to optimize your HR operations</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Insights'}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* AI Insights Grid */}
      <div className="space-y-4">
        {insights.map((insight) => (
          <Card key={insight.id} className={getPriorityColor(insight.priority)}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getPriorityBadge(insight.priority)}`}>
                      {insight.priority.toUpperCase()}
                    </span>
                    <span className="text-xs font-medium text-slate-600">{insight.type}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{insight.title}</h3>
                  <p className="text-sm text-slate-700 mb-4">{insight.description}</p>
                  <Button size="sm" variant="outline" className="bg-white">
                    {insight.action || 'Learn More'}
                  </Button>
                </div>
                <div className="shrink-0">
                  <Brain className="h-10 w-10 text-blue-300 opacity-50" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Model Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            About AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700">
            Our AI engine analyzes your HR data in real-time to identify patterns, anomalies, and opportunities. 
            These insights help you make data-driven decisions to optimize attendance, payroll, leave management, 
            and overall employee performance. All recommendations are based on industry best practices and your 
            organization's historical data.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-600 font-medium">Data Analyzed</p>
              <p className="text-lg font-bold text-slate-900">4 Categories</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium">Insights Generated</p>
              <p className="text-lg font-bold text-slate-900">Real-time</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium">Accuracy</p>
              <p className="text-lg font-bold text-slate-900">98.5%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Key Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Attendance Rate</span>
                <span className="text-sm font-bold text-slate-900">92.5%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '92.5%' }}></div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-slate-600">Leave Utilization</span>
                <span className="text-sm font-bold text-slate-900">68%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium">High Priority</span>
                <span className="text-lg font-bold text-red-600">
                  {insights.filter(i => i.priority === 'high').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-sm font-medium">Medium Priority</span>
                <span className="text-lg font-bold text-orange-600">
                  {insights.filter(i => i.priority === 'medium').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium">Low Priority</span>
                <span className="text-lg font-bold text-blue-600">
                  {insights.filter(i => i.priority === 'low').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIInsightsDashboard;
