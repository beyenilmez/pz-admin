export function captureProfiles(config) {
  const presentations = new Set(
    config.outputs.map((output) => output.presentation),
  );
  return [...presentations].map((presentation) => {
    const dimensions = config.viewports?.[presentation];
    if (
      !Number.isInteger(dimensions?.width) ||
      dimensions.width < 1 ||
      !Number.isInteger(dimensions?.height) ||
      dimensions.height < 1
    ) {
      throw new Error(
        `Configure a positive viewport width and height for ${presentation}.`,
      );
    }
    return {
      presentation,
      dimensions,
      outputs: config.outputs.filter(
        (output) => output.presentation === presentation,
      ),
    };
  });
}
