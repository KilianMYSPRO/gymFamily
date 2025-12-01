import React, { useState, useEffect } from 'react';
import { X, Calculator, Dumbbell } from 'lucide-react';
import Portal from '../common/Portal';
import { calculatePlates } from '../../utils/plateCalculator';
import { useLanguage } from '../../context/LanguageContext';
import clsx from 'clsx';

const PlateCalculator = ({ isOpen, onClose, initialWeight = '' }) => {
    const { t } = useLanguage();
    const [weight, setWeight] = useState(initialWeight);
    const [plates, setPlates] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setWeight(initialWeight);
        }
    }, [isOpen, initialWeight]);

    useEffect(() => {
        const w = parseFloat(weight);
        if (!isNaN(w)) {
            setPlates(calculatePlates(w));
        } else {
            setPlates([]);
        }
    }, [weight]);

    if (!isOpen) return null;

    const getPlateColor = (size) => {
        switch (size) {
            case 25: return 'bg-red-600 border-red-500 text-white';
            case 20: return 'bg-blue-600 border-blue-500 text-white';
            case 15: return 'bg-yellow-500 border-yellow-400 text-black';
            case 10: return 'bg-green-600 border-green-500 text-white';
            case 5: return 'bg-white border-slate-300 text-black';
            case 2.5: return 'bg-black border-slate-600 text-white';
            case 1.25: return 'bg-slate-400 border-slate-300 text-black';
            default: return 'bg-slate-700 border-slate-600 text-white';
        }
    };

    const getPlateHeight = (size) => {
        switch (size) {
            case 25: return 'h-32';
            case 20: return 'h-32';
            case 15: return 'h-28';
            case 10: return 'h-24';
            case 5: return 'h-20';
            case 2.5: return 'h-16';
            case 1.25: return 'h-14';
            default: return 'h-12';
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                <Calculator size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{t('plateCalculator.title') || 'Plate Calculator'}</h3>
                                <p className="text-xs text-slate-400">{t('plateCalculator.subtitle') || 'Standard 20kg Bar'}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Input */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-full max-w-[200px]">
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 px-6 text-center text-4xl font-bold text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                                    autoFocus
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 font-medium">kg</span>
                            </div>
                        </div>

                        {/* Visual Representation */}
                        <div className="relative h-40 flex items-center justify-center bg-slate-950/50 rounded-2xl border border-slate-800/50 overflow-hidden">
                            {/* Bar */}
                            <div className="absolute w-full h-4 bg-slate-600 z-0"></div>
                            <div className="absolute w-4 h-44 bg-slate-400 z-0 left-4 rounded-sm shadow-lg"></div> {/* Collar/Stop */}

                            {/* Plates */}
                            <div className="flex items-center gap-1 z-10 pl-8 overflow-x-auto max-w-full px-4">
                                {plates.length > 0 ? (
                                    plates.map((plate, index) => (
                                        <div
                                            key={index}
                                            className={clsx(
                                                "w-6 rounded flex items-center justify-center border-2 shadow-lg shrink-0",
                                                getPlateHeight(plate),
                                                getPlateColor(plate)
                                            )}
                                        >
                                            <span className="text-[10px] font-bold -rotate-90 whitespace-nowrap">{plate}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-slate-600 text-sm font-medium italic">
                                        {weight && parseFloat(weight) < 20 ? "Weight too low" : "Enter weight"}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Summary */}
                        {plates.length > 0 && (
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
                                    {t('plateCalculator.perSide') || 'Plates per side'}
                                </h4>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {Object.entries(plates.reduce((acc, curr) => {
                                        acc[curr] = (acc[curr] || 0) + 1;
                                        return acc;
                                    }, {})).sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])).map(([plate, count]) => (
                                        <div key={plate} className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-700">
                                            <span className="text-indigo-400 font-bold">{count}x</span>
                                            <span className="text-white font-medium">{plate}kg</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default PlateCalculator;
