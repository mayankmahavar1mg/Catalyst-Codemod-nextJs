# Catalyst Project Setup

## Prerequisites

- Node version 20.4.0 or later

## Setup Instructions

1. **Install dependencies**

   Run the following command in your project directory:

   ```bash
   npm i
   ```

2. **Install Catalyst**

   Install Catalyst to your desired path using:

   ```bash
   npx create-catalyst-app@latest
   ```

   Follow the prompts to complete the installation.

3. **Run migrations**

   Execute the migration command:

   ```bash
   npm run migrate
   ```

4. **Navigate to the project folder**

   Change to your Catalyst project directory:

   ```bash
   cd [your-catalyst-project-name]
   ```

5. **Update configuration**

   Review and update the configuration files in your project according to your specific requirements.

6. **Build and run the project**

   Build the project:

   ```bash
   npm run devBuild
   ```

   Then start the application:

   ```bash
   npm start
   ```

## Additional Notes

- Make sure to review any environment-specific setup or configuration that may be required for your project.
- Consult the Catalyst [documentation](https://catalyst.1mg.com/public_docs/) for more detailed information on configuration options and advanced features.
