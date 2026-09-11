'use client';

import React from 'react';
import Link from 'next/link';
import {
  Workflow,
  Sparkles,
  Github,
  Zap,
  Clock,
  Layers
} from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl shadow-lg shadow-black/20">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Workflow className="w-5 h-5 text-cyan-400 group-hover:text-emerald-300 transition-colors" />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-xl text-white font-heading">
                    VSM<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400"> Lean Canvas</span>
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 leading-none font-medium hidden sm:inline">
                  Mapeamento de Fluxo de Valor Corporativo • Lean Six Sigma
                </span>
              </div>
            </Link>

            {/* Author Credit Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 shadow-inner ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">Criado por</span>
              <strong className="text-cyan-300 font-semibold tracking-wide">Mauricio Grigol</strong>
            </div>
          </div>

          {/* Navigation Items & External Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400">
              <span className="text-cyan-400 font-bold">Design BagTime</span>
              <span>•</span>
              <span className="text-emerald-400">SPA Interativa</span>
            </div>

            <a
              href="https://github.com/Mauthope/vsm-lean-canvas"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
              title="Ver no GitHub"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>

        </div>
      </div>
    </header>
  );
};
