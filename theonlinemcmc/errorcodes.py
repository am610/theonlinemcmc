DATA_READ_ERR = 1001
ABSCISSA_READ_ERR = 1002
SIGMA_READ_ERR = 1003
MCMC_RUN_ERR = 1004
PRIOR_INIT_ERR = 1005
MCMC_INIT_ERR = 1006
POST_OUTPUT_ERR = 1007
POST_PROCESS_ERR = 1008
DATA_LENGTH_ERR = 1009

errormessages = {}
errormessages[DATA_READ_ERR] = "There was a problem reading in the data."
errormessages[ABSCISSA_READ_ERR] = "There was a problem reading in the abscissa variable file."
errormessages[SIGMA_READ_ERR] = "There was a problem reading in the data standard deviation file."
errormessages[MCMC_RUN_ERR] = "There was a problem running the MCMC."
errormessages[PRIOR_INIT_ERR] = "There was a problem initialising the prior values."
errormessages[MCMC_INIT_ERR] = "There was a problem initialising the MCMC."
errormessages[POST_OUTPUT_ERR] = "There was a problem outputing the posterior file."
errormessages[POST_PROCESS_ERR] = "There was a problem running the post-processing page."
errormessages[DATA_LENGTH_ERR] = "There are inconsistent lengths between data, abscissa, and/or sigma lengths."
