import React from 'react';

export default function PageHero(): JSX.Element {
  return (
    <header className="blog-hero">
      <div className="blog-hero__banner">
        <span className="blog-hero__chip">FIELD NOTES</span>
        <span className="blog-hero__ticks" aria-hidden="true" />
      </div>
      <nav className="blog-hero__breadcrumb" aria-label="Breadcrumb">
        <a href="https://landonfoister.com/">Home</a>
      </nav>
      <section className="blog-hero__about">
        <p className="blog-hero__eyebrow">// ABOUT THIS CHANNEL</p>
        <h1 className="blog-hero__title">
          Research notes from the lab bench.
        </h1>
        <div className="blog-hero__body">
          <p>
            Field Notes is the long-form companion to{' '}
            <a href="https://landonfoister.com/">landonfoister.com</a> — a
            working journal for vulnerability research, home-lab builds, and
            competition after-actions. Posts are working documents, not polished
            essays: I publish when something is reproducible enough to be useful
            to someone else.
          </p>
          <p>
            Expect technical write-ups, build logs from the Proxmox cyber range,
            certification debriefs, and the occasional teardown of a tool or
            technique I had to learn the hard way.
          </p>
        </div>
      </section>
    </header>
  );
}
