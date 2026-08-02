import React, { useState, useEffect } from 'react';
import { Sparkles, Info, ShieldCheck, BookmarkCheck } from 'lucide-react';
import apiClient from '../../api/client';
import RecommendationCard from '../../components/common/RecommendationCard';
import Card from '../../components/common/Card';

const Recommendations = () => {
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState([]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/ai/recommendations');
      setRecs(res.data || []);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  // Separate subscriptions
  const subs = recs.filter(r => r.title.startsWith("Recurring Payment"));
  const suggestions = recs.filter(r => !r.title.startsWith("Recurring Payment"));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs text-zinc-400 animate-pulse">
        Compiling spending alerts and subscription logs...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-zinc-100 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent-indigo" /> AI Optimization Suggestions
        </h1>
        <p className="text-xs text-zinc-450 mt-1">Review personalized recommendations to reduce leakage and allocate cash surpluses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Recommendations list */}
        <div className="md:col-span-2 space-y-4">
          <Card title="Active Suggestions" subtitle="Prioritized optimization guidelines">
            <div className="space-y-4">
              {suggestions.length === 0 ? (
                <div className="flex items-center justify-center py-6 text-zinc-550 text-xs gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-accent-emerald" />
                  No optimization flags detected for your profile.
                </div>
              ) : (
                suggestions.map(r => (
                  <RecommendationCard key={r.recommendation_id} recommendation={r} />
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Subscriptions & Recurring Payments */}
        <Card title="Recurring Subscriptions" subtitle="Detected memberships list" className="md:col-span-1">
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {subs.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3 text-center">No subscriptions identified.</p>
            ) : (
              subs.map(s => (
                <div key={s.recommendation_id} className="p-3 border border-zinc-850 bg-zinc-900/20 rounded-lg space-y-1">
                  <h5 className="text-xs font-bold text-zinc-300 truncate">{s.title.replace("Recurring Payment: ", "")}</h5>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">{s.description}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Recommendations;
