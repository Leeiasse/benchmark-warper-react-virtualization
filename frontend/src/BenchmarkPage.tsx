import { useParams, useSearchParams } from "react-router-dom";
import { BenchmarkWrapper } from "./benchmarks/BenchmarkWrapper";
import { WarperBench } from "./benchmarks/WarperBench";
import { TanStackBench } from "./benchmarks/TanStackBench";
import { ReactWindowBench } from "./benchmarks/ReactWindowBench";
import { ReactVirtuosoBench } from "./benchmarks/ReactVirtuosoBench";
import type { Library } from "./config";

const BENCH_COMPONENTS: Record<Library, React.ComponentType<any>> = {
  warper: WarperBench,
  tanstack: TanStackBench,
  "react-window": ReactWindowBench,
  virtuoso: ReactVirtuosoBench,
};

export function BenchmarkPage() {
  const { library } = useParams<{ library: string }>();
  const [searchParams] = useSearchParams();

  const lib = library as Library;
  const volume = parseInt(searchParams.get("volume") || "100000", 10);
  const embedded = searchParams.get("embedded") === "true";

  const BenchComponent = BENCH_COMPONENTS[lib];

  if (!BenchComponent) {
    return <div className="bench-error">Unknown library: {library}</div>;
  }

  return (
    <div className={`bench-page ${embedded ? "embedded" : ""}`}>
      {!embedded && <h1>Benchmark: {library}</h1>}
      <BenchmarkWrapper library={lib} volume={volume} embedded={embedded}>
        {(props) => <BenchComponent {...props} />}
      </BenchmarkWrapper>
    </div>
  );
}
