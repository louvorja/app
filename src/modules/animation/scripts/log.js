export default (message) => {
  console.log(message);

  return {
    status: "success",
    message: "Log message printed successfully",
  };
};
