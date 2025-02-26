# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository before proceeding.

Please note that we have a code of conduct, which should be followed in all interactions with the project.

## Development Setup

To set up your environment for contributing:

1. Clone the repository:
   ```bash
   git clone git@github.com:brisa-build/brisa.git
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Build the project:
   ```bash
   bun run build:all
   ```

### Running Tests

- **Write failing tests** related to the issue or feature you are working on before you implement changes.
- To run tests:
  ```bash
  bun run test path/to/file.test.ts --watch
  ```
- You can symlink Brisa in a project using:
  ```bash
  bun create brisa
  ```
  This allows you to test what is being developed via the symlink.

**Note:** Some tests (~9 out of 3000+) have issues with the latest Bun versions when running `bun run test`, but they pass fine when run individually. This is being actively worked on.

Feel free to improve this document by explaining unclear sections or adding helpful details for beginners.

## Pull Request Process

1. Ensure you are submitting the PR to the `canary` branch.
2. Include any related tests for the changes you make.
3. Update the documentation if your change affects the interface.
4. You may merge the Pull Request once you have at least one maintainer's approval. If you do not have merge permissions, request a maintainer to merge it.

## Code of Conduct

### Our Pledge

We are committed to fostering an open and welcoming environment, ensuring that participation in our project and community remains a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contribute to a positive environment include:

- Using inclusive language
- Respecting differing viewpoints
- Accepting constructive feedback with grace
- Focusing on the well-being of the community
- Showing empathy towards others

Examples of unacceptable behavior include:

- Sexualized language or unwelcome advances
- Trolling, insults, and derogatory comments
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct that is inappropriate in a professional setting

### Our Responsibilities

Project maintainers are responsible for enforcing this Code of Conduct. They have the right to remove, edit, or reject contributions that do not align with this, and may take action against inappropriate behavior, including banning contributors.

### Scope

This Code of Conduct applies within project spaces and in public spaces when an individual represents the project or community. Examples include using official email, posting via project social media, or acting as a representative at events.

### Enforcement

Instances of unacceptable behavior may be reported by contacting the team at contact@brisa.build.com. All complaints will be reviewed and investigated with confidentiality. Maintainers not upholding the Code may face consequences.

### Attribution

This Code of Conduct is adapted from the [Contributor Covenant](http://contributor-covenant.org), version 1.4, available at [http://contributor-covenant.org/version/1/4/](http://contributor-covenant.org/version/1/4/).
