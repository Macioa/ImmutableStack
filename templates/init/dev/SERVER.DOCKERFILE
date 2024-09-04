# Use the official Elixir image as the base image
FROM elixir:1.16-alpine

# Install Hex and Rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# Set the working directory
WORKDIR /app

# Copy the mix.exs and mix.lock files to the container
COPY mix.exs mix.lock ./

# Install dependencies
RUN mix deps.get

# Copy the rest of the application code to the container
COPY . .

# Set the environment to development
ENV MIX_ENV=dev

# Expose port 4000
EXPOSE 4000

# Run the Phoenix server
CMD ["mix", "phx.server"]