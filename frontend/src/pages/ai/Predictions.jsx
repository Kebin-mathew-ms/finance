import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, RefreshCw, CheckCircle2 } from 'lucide-react';
import apiClient from '../../api/client';
import PredictionCard from '../../components/common/PredictionCard';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const Predictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [algorithm, setAlgorithm] = useState('random_forest');
  const [message, setMessage] = useState('');

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post('/ai/predict');
      setPredictions(res.data || []);
    } catch (err) {
      console.error("Failed to load predictions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleRetrain = async (e) => {
    e.preventDefault();
    setTraining(true);
    setMessage('');
    try {
      const res = await apiClient.post(`/ai/train?algorithm=${algorithm}`);
      setMessage(`Successfully trained model type: "${res.data.model_type_generated}"`);
      // Reload predictions with new model weights
      fetchPredictions();
    } catch (err) {
      console.error("Model training failed:", err);
      setMessage("Failed to train models. Check historical expense density.");
    } finally {
      setTraining(false);
    }
  };

  if (loading && predictions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs text-zinc-400 animate-pulse">
        Fitting regression estimators and generating predictions...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-zinc-100 flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-accent-indigo" /> Machine Learning Expense Forecasting
          </h1>
          <p className="text-xs text-zinc-450 mt-1">Predict future spending behavior using Random Forest, XGBoost and Linear Regression models.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ML Training Controller Panel */}
        <Card title="Training Control Deck" subtitle="Fine-tune machine learning hyperparameters" className="lg:col-span-1 h-fit">
          <form onSubmit={handleRetrain} className="space-y-4">
            {message && (
              <div className="text-[10px] p-2 bg-zinc-900/50 border border-zinc-800 rounded text-zinc-300 flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="h-4 w-4 text-accent-emerald shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Algorithm Model</label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="block w-full bg-zinc-900 border border-zinc-850 rounded-lg text-xs text-zinc-105 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent-indigo"
              >
                <option value="random_forest">Random Forest Regressor</option>
                <option value="xgboost">XGBoost Regressor</option>
                <option value="linear">Linear Regression</option>
              </select>
            </div>

            <Button type="submit" loading={training} className="w-full text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retrain Model Parameters
            </Button>

            <div className="text-[9px] text-zinc-600 leading-relaxed border-t border-white/5 pt-3">
              <p>Model outputs are serialised to joblib objects on the server. Contamination levels and regression depths are scaled according to transaction counts.</p>
            </div>
          </form>
        </Card>

        {/* Prediction Cards Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-xs font-bold text-zinc-400">
            Next Month Category Forecasts
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {predictions.length === 0 ? (
              <div className="text-xs text-zinc-550 text-center py-8 col-span-2">
                No predictions generated. Train model first.
              </div>
            ) : (
              predictions.map((p, idx) => (
                <PredictionCard key={idx} prediction={p} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predictions;
