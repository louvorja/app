export default (message) => {
  if (import.meta.env.DEV) console.log(message);

  return {
    status: "success",
    message: "Log message printed successfully",
  };
};
