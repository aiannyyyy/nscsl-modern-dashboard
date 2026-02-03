interface UnsatMetricCardProps {
  value: string | number;
  label: string;
  onClick?: () => void;
  isRate?: boolean;
}

const UnsatMetricCard = ({ value, label, onClick, isRate }: UnsatMetricCardProps) => (
  <div
    className={`bg-white dark:bg-gray-800 p-6 rounded-lg text-center ${
      !isRate ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
    }`}
    onClick={!isRate ? onClick : undefined}
  >
    <div
      className={`text-3xl font-bold mb-1 ${
        isRate ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
      }`}
    >
      {value}
    </div>
    <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
  </div>
);

export default UnsatMetricCard;
