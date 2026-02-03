interface MetricCardProps {
  value: string | number;
  label: string;
  clickable?: boolean;
  onClick?: () => void;
}

const MetricCard = ({ value, label, clickable, onClick }: MetricCardProps) => (
  <div
    className={`text-center ${
      clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
    }`}
    onClick={clickable ? onClick : undefined}
  >
    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
      {value}
    </div>
    <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
  </div>
);

export default MetricCard;
