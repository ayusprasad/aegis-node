'use client';

interface FeatureCardProps {
  icon: string;
  title: string;
  badge: string;
  badgeColor: 'blue' | 'purple' | 'cyan';
  description: string;
  detail: string;
}

const BADGE_COLORS = {
  blue: 'bg-aegis-950 text-aegis-400 border-aegis-800',
  purple: 'bg-purple-950 text-purple-400 border-purple-800',
  cyan: 'bg-cyan-950 text-cyan-400 border-cyan-800',
};

export default function FeatureCard({ icon, title, badge, badgeColor, description, detail }: FeatureCardProps) {
  return (
    <div className="glass rounded-2xl p-6 hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group">
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${BADGE_COLORS[badgeColor]}`}>
          {badge}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-aegis-300 transition-colors">
        {title}
      </h3>
      <p className="text-gray-400 text-sm leading-relaxed mb-4">
        {description}
      </p>
      <div className="border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-500 leading-relaxed font-mono">
          {detail}
        </p>
      </div>
    </div>
  );
}
