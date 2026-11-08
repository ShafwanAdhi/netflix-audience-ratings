import { Link } from "react-router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { ratingFamily, RATING_FAMILIES } from "../../lib/dataColors";
import { DataLegend } from "../../components/DataLegend";
import { useOverview } from "../../lib/api";
import { Note, PageHeading, State } from "../../components/Shared";
export function OverviewPage() {
  const { data, error, isPending } = useOverview();
  if (!data) return <State error={error} loading={isPending} />;
  const ratings = Object.entries(data.rating_counts).map(([label, count]) => ({
    label,
    count,
  }));
  return (
    <>
      <PageHeading
        eyebrow="SUPERVISED LEARNING"
        title="Audience rating classification"
        action={
          <Link className="button" to="/predict">
            Try a prediction
          </Link>
        }
      >
        Predict content ratings from catalog metadata. Explore the data, compare
        classifiers, and inspect what the model learns.
      </PageHeading>
      <div className="summary-strip">
        <div>
          <span>CATALOG TITLES</span>
          <strong>{data.rows.toLocaleString()}</strong>
          <small>Historical Netflix snapshot</small>
        </div>
        <div>
          <span>TARGET LABELS</span>
          <strong>
            {ratings.length}
            <small className="inline-unit">categories</small>
          </strong>
          <small>Original rating labels retained</small>
        </div>
        <div>
          <span>MODEL-READY TITLES</span>
          <strong>{data.cleaned_rows.toLocaleString()}</strong>
          <small>After exact-content deduplication</small>
        </div>
        <div>
          <span>CATALOG ADDED THROUGH</span>
          <strong className="date-metric">Sep 2021</strong>
          <small>Latest entry: {data.date_added_max}</small>
        </div>
      </div>
      <section className="analysis-grid">
        <div>
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 / TARGET DISTRIBUTION</p>
              <h2>A catalog with an uneven audience</h2>
            </div>
            <span className="subtle-label">RAW DATA · ALL TITLES</span>
          </div>
          <p className="section-description">
            Mature and teen audiences dominate. Rare ratings remain visible in
            every evaluation.
          </p>
          <div className="chart-label">
            <span>Number of titles</span>
          </div>
          <div
            className="distribution-chart"
            role="region"
            tabIndex={0}
            aria-label="Raw rating distribution; TV-MA is the largest class with 3,205 titles"
          >
            <div className="chart-canvas">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ratings}
                  margin={{ top: 10, right: 8, left: -18, bottom: 32 }}
                >
                  <CartesianGrid vertical={false} stroke="#d0d0d0" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#000000" }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f0f0f0" }}
                    contentStyle={{
                      border: "1px solid #000000",
                      borderRadius: 4,
                    }}
                  />
                  <Bar dataKey="count" name="Titles" isAnimationActive={false}>
                    {ratings.map(({ label }) => (
                      <Cell key={label} fill={ratingFamily(label).color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="chart-scroll-hint">
            Swipe the chart or focus it and use arrow keys to see all 14
            ratings.
          </p>
          <DataLegend
            items={RATING_FAMILIES}
            label="Audience rating color families"
          />
          <p className="table-note">
            Colors identify audience families for display only; all 14 labels
            remain separate. Counts before deduplication.
          </p>
        </div>
        <aside className="dataset-aside">
          <h2>Inside the dataset</h2>
          <p>
            Ten metadata columns describe movies and series across countries,
            genres, and release years.
          </p>
          <dl>
            <div>
              <dt>Movies</dt>
              <dd>{data.type_counts.Movie.toLocaleString()}</dd>
            </div>
            <div>
              <dt>TV shows</dt>
              <dd>{data.type_counts["TV Show"].toLocaleString()}</dd>
            </div>
            <div>
              <dt>Release years</dt>
              <dd>
                {data.release_year_min}–{data.release_year_max}
              </dd>
            </div>
            <div>
              <dt>Target</dt>
              <dd>
                <code>rating</code>
              </dd>
            </div>
          </dl>
          <Link className="text-button" to="/methodology">
            Explore the methodology
          </Link>
        </aside>
      </section>
      <section className="quality-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / DATA QUALITY</p>
            <h2>Clean data starts with visible limitations.</h2>
          </div>
        </div>
        <div className="quality-rows">
          <div>
            <strong>03</strong>
            <div>
              <h3>Exact-content duplicates removed</h3>
              <p>
                Different IDs, identical content attributes. The removal mapping
                is preserved.
              </p>
            </div>
            <span className="tag">RESOLVED</span>
          </div>
          <div>
            <strong>04</strong>
            <div>
              <h3>Repeated content entities reviewed</h3>
              <p>
                Case and whitespace variants stay together in training and
                cross-validation. One entity has conflicting ratings.
              </p>
            </div>
            <span className="tag">GROUPED</span>
          </div>
          <div>
            <strong>2,588</strong>
            <div>
              <h3>Director entries are “Not Given”</h3>
              <p>
                No null cells does not mean complete metadata. Country is also
                unknown for 287 titles.
              </p>
            </div>
            <span className="tag">DOCUMENTED</span>
          </div>
        </div>
      </section>
      <Note>
        These are age/content classifications, not viewer scores. This
        metadata-based experiment does not provide official age certification.
        Data source provenance beyond the supplied CSV remains unverified.
      </Note>
    </>
  );
}
