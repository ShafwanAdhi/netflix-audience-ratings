import { MultiSelect } from "../../components/MultiSelect";
import { ratingFamily } from "../../lib/dataColors";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useMetadata, request, percent, modelName } from "../../lib/api";
import type { Prediction, PredictionRequest } from "../../lib/api";
import {
  Help,
  Note,
  PageHeading,
  RunStamp,
  State,
} from "../../components/Shared";
export const formSchema = z.object({
  content_type: z.enum(["Movie", "TV Show"]),
  release_year: z.number().int().min(1).max(9999),
  countries: z.array(z.string()),
  genres: z.array(z.string()).min(1, "Select at least one genre."),
  duration: z.string().regex(/^[1-9]\d*$/, "Enter a positive whole number."),
  director: z.string(),
});
type Form = z.infer<typeof formSchema>;
export function PredictPage() {
  const { data, error, isPending } = useMetadata();
  const [exampleNote, setExampleNote] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content_type: "Movie",
      release_year: 2020,
      countries: ["United States"],
      genres: [],
      duration: "",
      director: "",
    },
  });
  const kind = watch("content_type");
  const mutation = useMutation({
    mutationFn: (body: PredictionRequest) =>
      request<Prediction>("/tasks/3/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  });
  if (!data) return <State error={error} loading={isPending} />;
  const submit = (form: Form) => {
    mutation.mutate({
      ...form,
      duration: {
        value: Number(form.duration),
        unit: form.content_type === "Movie" ? "minutes" : "seasons",
      },
      director: form.director || null,
    });
  };
  const loadExample = (type: "Movie" | "TV Show") => {
    const example = data.examples.find((e) => e.content_type === type)!;
    reset({
      content_type: type,
      release_year: example.release_year,
      countries: example.countries,
      genres: example.genres,
      duration: String(example.duration.value),
      director: example.director || "",
    });
    mutation.reset();
    setExampleNote(
      `Loaded “${example.title}” from training data. Illustration only, not evidence of generalization.`,
    );
  };
  return (
    <>
      <PageHeading
        eyebrow="INFERENCE"
        title="Read the metadata. Predict the rating."
      >
        Explore how content attributes influence a classifier’s estimate. Every
        prediction uses the frozen, evaluated pipeline.
      </PageHeading>
      <div className="predict-grid">
        <section className="input-section">
          <div className="section-heading">
            <h2>Content attributes</h2>
            <span className="subtle-label">01 / INPUT</span>
          </div>
          <div className="example-buttons">
            <span>Example input</span>
            <button onClick={() => loadExample("Movie")}>Movie</button>
            <button onClick={() => loadExample("TV Show")}>TV show</button>
          </div>
          {exampleNote && (
            <p className="example-note" role="status">
              {exampleNote}
            </p>
          )}
          <form
            onSubmit={handleSubmit(submit)}
            onChange={() => mutation.reset()}
            noValidate
          >
            <fieldset>
              <legend>Content type</legend>
              <div className="type-picker">
                {(["Movie", "TV Show"] as const).map((type) => (
                  <label key={type} className={kind === type ? "active" : ""}>
                    <input
                      type="radio"
                      value={type}
                      {...register("content_type", {
                        onChange: () => {
                          setValue("duration", "");
                          mutation.reset();
                          setExampleNote("");
                        },
                      })}
                    />

                    {type}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="form-row">
              <label>
                Release year
                <input
                  type="number"
                  {...register("release_year", { valueAsNumber: true })}
                  aria-invalid={!!errors.release_year}
                />
                {errors.release_year && (
                  <small className="field-error">
                    Enter a valid whole year.
                  </small>
                )}
              </label>
              <label>
                {kind === "Movie" ? "Duration (minutes)" : "Number of seasons"}
                <input
                  type="number"
                  placeholder={kind === "Movie" ? "e.g. 95" : "e.g. 2"}
                  {...register("duration")}
                  aria-invalid={!!errors.duration}
                />
                {errors.duration && (
                  <small className="field-error">
                    Enter a positive whole number.
                  </small>
                )}
              </label>
            </div>
            <MultiSelect
              label="Countries"
              options={data.countries}
              value={watch("countries")}
              unknown
              onChange={(values) => {
                setValue("countries", values, { shouldValidate: true });
                mutation.reset();
              }}
            />
            <MultiSelect
              label="Genres"
              options={data.genres}
              value={watch("genres")}
              error={errors.genres?.message}
              onChange={(values) => {
                setValue("genres", values, { shouldValidate: true });
                mutation.reset();
              }}
            />
            {data.uses_director && (
              <label>
                Director
                <input
                  placeholder="Unknown / Not Given"
                  {...register("director")}
                />
                <small>Use the original catalog spelling when available.</small>
              </label>
            )}
            <button
              className="button submit-button"
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Running the pipeline…"
                : "Predict audience rating"}
            </button>
            <button
              type="button"
              className="reset-button"
              onClick={() => {
                reset({
                  content_type: "Movie",
                  release_year: 2020,
                  countries: [],
                  genres: [],
                  duration: "",
                  director: "",
                });
                mutation.reset();
                setExampleNote("");
              }}
            >
              Reset inputs
            </button>
          </form>
        </section>
        <section
          className="result-section"
          aria-live="polite"
          aria-busy={mutation.isPending}
        >
          <div className="section-heading">
            <h2>Model estimate</h2>
            <span className="subtle-label">02 / OUTPUT</span>
          </div>
          {mutation.error ? (
            <State error={mutation.error} />
          ) : mutation.data ? (
            <div
              className="prediction-result"
              data-motion-revision={
                mutation.isSuccess ? mutation.submittedAt : undefined
              }
            >
              <p className="eyebrow">PREDICTED AUDIENCE RATING</p>
              <div
                className="rating-label"
                style={{ background: ratingFamily(mutation.data.label).color }}
              >
                {mutation.data.label}
              </div>
              <h3>{mutation.data.meaning}</h3>
              <p className="muted">Estimated from your content metadata.</p>
              <div className="probability-list">
                <h4>
                  Top model probabilities{" "}
                  <Help text="These values are not calibrated certainty. Only the top three classes are shown." />
                </h4>
                {mutation.data.probabilities.map((item) => (
                  <div key={item.label}>
                    <div>
                      <span>{item.label}</span>
                      <strong>{percent(item.probability)}</strong>
                    </div>
                    <div className="probability-track">
                      <i
                        style={{
                          width: percent(item.probability),
                          background: ratingFamily(item.label).color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="table-note">
                Color follows the audience family shown in Overview. Bar length
                shows model probability, not calibrated certainty.
              </p>
              <div className="support-line">
                <span>Training examples for {mutation.data.label}</span>
                <strong>
                  {mutation.data.training_support.toLocaleString()}
                </strong>
              </div>
              {mutation.data.warnings.map((note) => (
                <p className="warning" key={note}>
                  {note}
                </p>
              ))}
            </div>
          ) : (
            <div className="empty-prediction">
              <span className="prediction-orbit">OUTPUT / 02</span>
              <h3>A prediction starts with context.</h3>
              <p>
                Add content attributes or load an example.
                <br />
                The model’s estimate will appear here.
              </p>
            </div>
          )}
          <div className="model-caption">
            <span className="ready-dot" /> {modelName(data.model_id)}
            <span>Frozen pipeline</span>
          </div>
          <Note>
            Probabilities describe the model’s output, not verified certainty.
            Predictions do not replace official content review. Rare classes
            have very limited support.
          </Note>
        </section>
      </div>
      <RunStamp run={data.run_id} />
    </>
  );
}
