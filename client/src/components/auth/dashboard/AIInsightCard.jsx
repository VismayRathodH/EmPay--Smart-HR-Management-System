import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

const AIInsightCard = () => {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsight = async () => {
    setLoading(true);
    setError(null);
    try {
      // Placeholder for actual API call
      // const response = await fetch('/api/ai/suggest', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ type: 'insight', data: {} })
      // });
      // const data = await response.json();
      // setInsight(data.suggestion);
      
      // Mock delay and response
      await new Promise(resolve => setTimeout(resolve, 1500));
      setInsight("Attendance in the Engineering department has dropped by 4% this week. Consider checking in with the team lead.");
    } catch (err) {
      setError('Failed to load AI insight.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsight();
  }, []);

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-full text-blue-600 shrink-0 mt-1 sm:mt-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-blue-900 flex items-center gap-2">
              HR AI Insight
            </h3>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-blue-700 mt-1">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing recent trends...
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            ) : (
              <p className="text-sm text-blue-800 mt-1 leading-relaxed">
                {insight}
              </p>
            )}
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchInsight} 
          disabled={loading}
          className="shrink-0 bg-white/50 hover:bg-white/80 border-blue-200 text-blue-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardContent>
    </Card>
  );
};

export default AIInsightCard;
