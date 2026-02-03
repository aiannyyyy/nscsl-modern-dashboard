import MetricCard from "./MetricCard";

const UnsatisfactorySection = () => (
  <div className="bg-red-100 p-5 rounded-lg shadow">
    <h3 className="font-bold text-red-700 mb-4">
      ⚠️ Unsatisfactory Samples
    </h3>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard label="Contaminated" value="-" clickable />
      <MetricCard label="Insufficient" value="-" clickable />
      <MetricCard label="Missing Info" value="-" clickable />
      <MetricCard label="Total Unsat Rate" value="-" />
    </div>
  </div>
);

export default UnsatisfactorySection;
