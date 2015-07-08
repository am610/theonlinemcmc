var pyfile = "";
var modeleq = "";
var variables = [];
var nabscissa = 0; // number of abscissa variables (can only have 1 at the moment)

var data_form_id = ""; // the id that the data input form will have (there are two possibilities)

var abscissavar = "";

var absfile = "abscissa_file.txt";
var datafile = "data_file.txt";
var sigmafile = "sigma_file.txt";

$(document).ready(function() {
  // change data input form type
  $('#data_input_type').change(function(){
    var vartype = $(this).val();

    if ( vartype == "Input" ){
      $("#id_submit_data_upload").prop("type", "hidden"); // make sure other option is re-hidden if things change
      $("#id_submit_data_form").css("display", "");
      data_form_id = "#id_submit_data_form";
    }
    if ( vartype == "Upload" ){
      $("#id_submit_data_form").css("display", "none"); // make sure other option is re-hidden if things change
      $("#id_submit_data_upload").prop("type", "file");
      data_form_id = "#id_submit_data_upload";
    }
  });

  // change likelihood type
  $('#likelihood_input_type').change(function(){
    var liketablerow = document.getElementById("like_row");
    // delete any extra cells from previous choices
    while ( liketablerow.cells.length > 1 ){
      liketablerow.deleteCell(-1);
    }

    if ( $(this).val() == "Gaussian" ){
      var newcell = liketablerow.insertCell(-1);
      newcell.innerHTML = "<select id=\"id_gauss_like_type\">\
  <option value=\"\">--Type--</option>\
  <option value=\"Known1\">Input &sigma; value</option>\
  <option value=\"Known2\">Input &sigma; values</option>\
  <option value=\"Fit\">Fit &sigma; value</option>\
</select>";

      $('#id_gauss_like_type').change(function(){
        while ( liketablerow.cells.length > 2 ){
          liketablerow.deleteCell(-1);
        }

        var gausstype = $(this).val();
        var newcell2 = liketablerow.insertCell(-1);
    
        if ( gausstype == "Known1" ){  
          newcell2.innerHTML = "<input type=\"text\" id=\"id_gauss_known\" value=\"&sigma;\">";
        }
        if ( gausstype == "Known2" ){
          newcell2.innerHTML = "<select id=\"id_gauss_known2_type\">\
  <option value=\"\">--Type--</option>\
  <option value=\"Input\">Input</option>\
  <option value=\"Upload\">Upload</option>\
</select>";
            
          $('#id_gauss_known2_type').change(function(){
            while ( liketablerow.cells.length > 3 ){
              liketablerow.deleteCell(-1);
            }

            var newcell3 = liketablerow.insertCell(-1);

            if ( $(this).val() == "Input" ){
              newcell3.innerHTML = "<textarea rows=\"1\" cols=\"20\" id=\"id_gauss_like_sigma_input\"></textarea>";
            }
            if ( $(this).val() == "Upload" ){
              newcell3.innerHTML = "<input type=\"file\" id=\"id_gauss_like_sigma_upload\">";
            }
          });
        }

        if ( gausstype == "Fit" ){
          newcell2.innerHTML = "<select id=\"sigma_gauss_prior\">\
  <option value=\"\">--Prior type--</option>\
  <option value=\"Uniform\">Uniform</option>\
  <option value=\"LogUniform\">Log(Uniform)</option>\
  <option value=\"Gaussian\">Gaussian</option>\
</select>";
            
          $('#sigma_gauss_prior').change(function(){
            while ( liketablerow.cells.length > 3 ){
              liketablerow.deleteCell(-1);
            }

            if ( $(this).val() == "Uniform" || $(this).val() == "LogUniform" ){
              var newcell3 = liketablerow.insertCell(-1);
              newcell3.innerHTML = "<input type=\"text\" id=\"sigma_gauss_prior_min\" value=\"Min.\">";
              newcell3 = liketablerow.insertCell(-1);
              newcell3.innerHTML = "<input type=\"text\" id=\"sigma_gauss_prior_max\" value=\"Max.\">";
            }

            if ( $(this).val() == "Gaussian" ){
              var newcell3 = liketablerow.insertCell(-1);
              newcell3.innerHTML = "<input type=\"text\" id=\"sigma_gauss_prior_mean\" value=\"Mean\">";
              newcell3 = liketablerow.insertCell(-1);
              newcell3.innerHTML = "<input type=\"text\" id=\"sigma_gauss_prior_sigma\" value=\"Standard deviation\">";
            }
          });
        }
      });
    }
  });

  $("#id_model_button").click(function(){
    // add input header
    document.getElementById("id_input_header").innerHTML = "Parameter inputs";

    // un-hide the div element
    $("#id_variables_div").css("display", "");
    
    // un-hide conditions field
    $("#id_conditions").prop("type", "text");

    // get model equation from form
    modeleq = $('#modeleq').val();
    var modeleqtmp = modeleq.slice(); // copy of model equation

    // list of math functions that need to be removed to count variables (maybe include more functions from http://docs.scipy.org/doc/scipy-0.14.0/reference/special.html in the future)
    var mfuncs = ["pi", "sin", "cos", "tan", "exp", "log", "log10", "sinh", "cosh", "tanh", "acos", "asin", "atan", "erf", "gamma"];
    var index;

    // replace math functions with whitespace 
    for (index = 0; index < mfuncs.length; index++) {
      modeleqtmp = modeleqtmp.replace(mfuncs[index], " ");
    }

    // list of characters to replace
    modeleqtmp = modeleqtmp.replace(/[&\/+().*]/g, " ");
    modeleqtmp = modeleqtmp.replace("^", " ");
    modeleqtmp = modeleqtmp.replace("-", " ");

    // replace all numbers with a space (using regular expression \d to represent all numbers and g to represent global replace) 
    modeleqtmp = modeleqtmp.replace(/[\d]+/g, " ");
    modeleqtmp = modeleqtmp.trim(); // strip leading and trailing whitespace

    // get names of variables in model equation by splitting modeleqtpm on any whitespace
    var variablestmp = modeleqtmp.split(/[ \t\n\r]+/);

    // remove any repeated variables (from http://stackoverflow.com/a/9229821/1862861)
    variables = variablestmp.filter(function(item, pos) {
      return variablestmp.indexOf(item) == pos;
    })

    // replace any different function names (e.g. acos -> arccos, and so on)
    var repfuncs = ["acos", "asin", "atan2", "atan", "^"];
    var repfuncsnew = ["arccos", "arcsin", "arctan2", "arctan", "**"];
    for (index=0; index < repfuncs.length; index++){
      modeleq = modeleq.replace(repfuncs[index], repfuncsnew[index]);
    }

    makeTable();
  });

  function makeTable(){
    if ( variables.length > 0 ){
      var tableel = document.getElementById("table_id");
      var nrows = tableel.rows.length;
      // delete any rows already present in cell
      if ( nrows > 0 ){
        for ( index=0; index < nrows; index++ ){
          tableel.deleteRow(-1);
        }
      }

      for (index=0; index < variables.length; index++){
        var row = tableel.insertRow(0);
        // set ID of row based on variable names
        row.setAttribute("id", "id_"+variables[index], 0);
        var cell = row.insertCell(0);
        cell.innerHTML = variables[index];

        createSelection(row, variables[index]);
      }
    }
  }

  function createSelection(row, variable){
    var cell = row.insertCell(-1);
    var idvartype = "id_vartype_"+variable;
    cell.innerHTML = "<select id=\""+idvartype+"\">\
  <option value=\"\">--Type--</option>\
  <option value=\"Constant\">Constant</option>\
  <option value=\"Variable\">Variable</option>\
  <option value=\"Abscissa\">Independent variable/abscissa</option>\
</select>";

    var previoustype;
    
    $('#'+idvartype).focus(function(){
      previoustype = $(this).val(); // store the previous value
    }).change(function(){
      var vartype = $(this).val();

      // number of cells in row
      var ncells = row.cells.length;
        
      if ( ncells > 2 ){
        for ( j = ncells; j > 2; j-- ){ row.deleteCell(-1); }
      }
  
      if( vartype == "Constant" ){
        // place input form in cell
        var newcell = row.insertCell(-1);
        newcell.innerHTML = "<input type=\"text\" id=\"id_constant_"+variable+"\" value=\"Value\">";
      }
        
      if( vartype == "Variable" ){
        // place select for in cell
        var newcell = row.insertCell(-1);
        var idpriortype = "id_priortype_"+variable;
        newcell.innerHTML = "<select id=\""+idpriortype+"\">\
    <option value=\"\">--Prior--</option>\
    <option value=\"Uniform\">Uniform</option>\
    <option value=\"LogUniform\">Log(Uniform)</option>\
    <option value=\"Gaussian\">Gaussian</option>\
</select>";

        createPriorSelection(row, variable);
      }

      if ( nabscissa == 1 && vartype != "Abscissa" && previoustype == "Abscissa" ){
        // reset nabscissa count in case an abscissa variable is changed to something else
        nabscissa = 0;
      }

      previoustype = $(this).val(); // set previous to current
      
      if( vartype == "Abscissa" ){
        if ( nabscissa == 1 ){
          alert('Can only have one abscissa at the moment');
          $(this).val(""); // revert back to empty value
        }
        else if ( nabscissa == 0 ){
          nabscissa = 1;

          var newcell = row.insertCell(-1);
          var idabscissatype = "id_abscissa_"+variable;
          newcell.innerHTML = "<select id=\""+idabscissatype+"\">\
    <option value=\"\">--Input type--</option>\
    <option value=\"Input\">Input</option>\
    <option value=\"Upload\">Upload</option>\
</select>";

          createAbscissaForm(row, variable);
        }
      }
    });
  }

  function createPriorSelection(row, variable){
    var idpriortype = "id_priortype_"+variable;

    $('#'+idpriortype).change(function(){
      var priortype = $(this).val();
        
      // number of cells in row
      var ncells = row.cells.length;
        
      if ( ncells > 3 ){
        for ( j = ncells; j > 3; j-- ){ row.deleteCell(-1); }
      }
        
      if( priortype == "Uniform" || priortype == "LogUniform" ){
        var cell = row.insertCell(-1);
        cell.innerHTML = "<input type=\"text\" id=\"minval_"+variable+"\" value=\"Min.\">";
        cell = row.insertCell(-1);
        cell.innerHTML = "<input type=\"text\" id=\"maxval_"+variable+"\" value=\"Max.\">";
      }

      if( priortype == "Gaussian" ){
        var cell = row.insertCell(-1);
        cell.innerHTML = "<input type=\"text\" name=\"meanval_"+variable+"\" value=\"Mean\">";
        cell = row.insertCell(-1);
        cell.innerHTML = "<input type=\"text\" name=\"sigmaval_"+variable+"\" value=\"Standard deviation\">";
      }
    });
  }

  function createAbscissaForm(row, variable){
    var idabscissatype = "id_abscissa_"+variable;
    abscissavar = variable;

    $('#'+idabscissatype).change(function(){
      var abscissatype = $(this).val();
        
      // number of cells in row
      var ncells = row.cells.length;

      if ( ncells > 3 ){
        for ( j = ncells; j > 3; j-- ){ row.deleteCell(-1); }
      }
      
      // add input form
      if ( abscissatype == "Input" ){
        var cell = row.insertCell(-1);
        //cell.innerHTML = "<input type=\"text\" id=\"id_abscissaval_"+variable+"\" value=\"\">";
        cell.innerHTML = "<textarea rows=\"1\" cols=\"20\" id=\"id_abscissaval\"></textarea>";
      }

      if ( abscissatype == "Upload" ){
        var cell = row.insertCell(-1);
        var idabscissafile = "id_abscissafile";
        cell.innerHTML = "<input type=\"file\" id=\""+idabscissafile+"\" value=\"\">";
      }

    });
  }

  // form submission
  $("#id_submit_variables").click(function(){
    // create python file for submission
    pyfile += "#!/usr/bin/env python\n\n";
    
    // import required packages
    pyfile += "import emcee\n";

    pyfile += "import numpy as np\n\
from numpy import pi, sin, cos, tan, exp, log, log10, arccos, arcsin, arctan, arctan2, sinh, cosh, tanh\n\
from scipy.special import erf, gamma\n\
from scipy.misc import factorial\n\n"

    var theta = []; // array for unpacking variables that require fitting

    // get all parameters requiring fitting and put them in an object
    var fitarray = {};
    for( index=0; index < variables.length; index++ ){
      var idvartype = "#id_vartype_" + variables[index];      
      var typeval = $(idvartype).val();

      if ( typeval == "Variable" ){
        theta.push(variables[index]);

        fitarray[variables[index]] = {priortype: "", minval: 0., maxval: 0., meanval: 0., sigmaval: 0.}; // object is an object that will contain prior info

        // fill in prior info
        var idpriortype = "#id_priortype_" + variables[index];
        var priortype = $(idpriortype).val();

        fitarray[variables[index]].priortype = priortype;

        if ( priortype == "Uniform" || priortype == "LogUniform" ){
          // get min/max values
          var idminval = "#minval_" + variables[index];
          var idmaxval = "#maxval_" + variables[index];
          var minmaxvals = getMinMaxValues(idminval, idmaxval);

          if ( minmaxvals.length == 0 ){ return false; } // there has been a problem

          fitarray[variables[index]].minval = minmaxvals[0];
          fitarray[variables[index]].maxval = minmaxvals[1];
        }

        if ( priortype == "Gaussian" ){
          // get mean/standard deviation values
          var idmeanval = "#meanval_" + variables[index];
          var idsigmaval = "#sigmaval_" + variables[index];
          var meanstdvals = getGaussianValues(idmeanval, idsigmaval);

          if ( meanstdvals.length == 0 ){ return false; } // there has been a problem

          fitarray[variables[index]].meanval = meanstdvals[0];
          fitarray[variables[index]].sigmaval = meanstdvals[1];
        }
      }
    }

    // check for fit parameters in likelihood function i.e. fitting a sigma value
    var gausstype = $('#id_gauss_like_type').val();
    if ( gausstype == "Fit" ){
      var idpriortype = "#sigma_gauss_prior";
      var priortype = $(idpriortype).val();

      variables.push("sigma_gauss"); // add sigma_gauss (parameter for fitting sigma) to variables array
      theta.push("sigma_gauss");

      fitarray["sigma_gauss"] = {priortype: "", minval: "", maxval: "", meanval: "", sigmaval: ""}; // object is an object that will contain prior info
      fitarray["sigma_gauss"].priortype = priortype;

      if ( priortype == "Uniform" || priortype == "LogUniform" ){
        // get min/max values
        var idminval = "#sigma_gauss_prior_min";
        var idmaxval = "#sigma_gauss_prior_max";
        var minmaxvals = getMinMaxValues(idminval, idmaxval);

        if ( minmaxvals.length == 0 ){ return false; } // there has been a problem

        fitarray["sigma_gauss"].minval = minmaxvals[0];
        fitarray["sigma_gauss"].maxval = minmaxvals[1];
      }

      if ( priortype == "Gaussian" ){
        // get mean/standard deviation values
        var idmeanval = "#sigma_gauss_prior_mean";
        var idsigmaval = "#sigma_gauss_prior_sigma";
        var meanstdvals = getGaussianValues(idmeanval, idsigmaval);

        if ( meanstdvals.length == 0 ){ return false; } // there has been a problem

        fitarray["sigma_gauss"].meanval = meanstdvals[0];
        fitarray["sigma_gauss"].sigmaval = meanstdvals[1];
      }
    }

    // write model function
    var modelfunction = "# define the model to fit to the data\ndef mymodel(";

    var conststring = "";
    var abscissastring = "";
    for (index=0; index < variables.length; index++){
      // check for constants
      var idvartype = "#id_vartype_" + variables[index];      
      var typeval = $(idvartype).val();

      if ( typeval == "Constant" ){
        var idconst = "#id_constant_" + variables[index];
        var constval = $(idconst).val();
        if ( constval != "Value" ){ // "Value" is the default value
          $(idconst).css("color", "black");

          // check value is actually a number
          if ( isNumber( constval ) ){
            conststring += "  " + variables[index] + " = " + constval + "\n";
          }
          else{
            alert("Constant value is not a number!");
            // add red warning to highlight the constant that is wrong
            $(idconst).css("color", "red");
            $(idconst).val("Invalid value");
            return false; // abort submission
          }
        }
        else{
          alert("Constant value is not set");
          $(idconst).css("color", "red");
          $(idconst).val("Invalid value");
          return false;
        }
      }

      if ( typeval == "Abscissa" ){
        abscissastring = variables[index];
      }
    }
    
    if ( abscissastring == "" ){ // must have an abscissa
      alert("There must be an independent variable/abscissa as an input");
      return false;
    }

    if ( theta.length == 0 ){ // must have a parameter to fit
      alert("There must be a parameter to fit");
      return false;
    }

    modelfunction += theta.join() + ", " + abscissastring;
    modelfunction += "):\n";
    modelfunction += conststring; // include constant values
    modelfunction += "  return ";
    modelfunction += modeleq.replace(/[ \t\n\r]+/, ""); // add model equation
    modelfunction += "\n\n";

    pyfile += modelfunction; // add to python file

    var gauss_like_sigma = "";
    if ( $("#likelihood_input_type").val() == "Gaussian" ){
      if ( $("#id_gauss_like_type").val().search("Known") != -1 ){
        gauss_like_sigma += ", sigma_gauss";
      }
    }

    // create log posterior function
    var posteriorfunction = "# define the log posterior function\n";
    posteriorfunction += "def lnprob(theta, " + abscissastring + gauss_like_sigma;   
    posteriorfunction += ", data):\n  lp = lnprior(theta)\n\
  if not np.isfinite(lp):\n\
    return -np.inf\n\n\
  return lp + lnlike(theta, " + abscissastring + gauss_like_sigma + ")\n\n";

    pyfile += posteriorfunction; // add to python file
    
    // create log prior function
    var priorfunction = "# define the log prior function\n";
    priorfunction += "def lnprior(theta):\n";
    priorfunction += "  lp = 0.\n";
    priorfunction += "  " + theta.join() + " = theta\n\n"; // unpack variables 

    // loop through fit array object
    for ( var priorvar in fitarray ){
      var priortype = fitarray[priorvar].priortype;

      if ( priortype == "Uniform" || priortype == "LogUniform" ){
        priorfunction += "  if ";
        
        if ( priortype == "Uniform" ){ priorfunction += fitarray[priorvar].minval + " < " + priorvar + " < " + fitarray[priorvar].maxval + ":\n"; }
        if ( priortype == "LogUniform" ){ priorfunction += "log(" + fitarray[priorvar].minval + ") < " + priorvar + " < log(" + fitarray[priorvar].maxval + "):\n"; }

        priorfunction += "    lp = 0\n  else:\n    return -np.inf\n\n";
      }

      if ( priortype == "Gaussian" ){
        priorfunction += "  lp -= 0.5*("+ priorvar + " - " + fitarray[priorvar].meanval + ")**2/" + fitarray[priorvar].sigmaval + "\n\n";
      }

      // maybe have other prior type (exponential?) (plus hyperparameters?)
    }

    // add condition in prior (should check that the condition actually contains the given variables)
    var conditions = $("#id_conditions").val();
    if ( conditions != "Conditions (e.g. x < 0 && y > z)" ){ // the default value
      priorfunction += "  if not (" + conditions + "):\n";
      priorfunction += "    return -np.inf\n\n";
    }

    priorfunction += "  return lp\n\n";

    pyfile += priorfunction;

    // create log likelihood function
    var likefunction = "# define log likelihood function\n";
    likefunction += "def lnlike(theta, " + abscissastring + gauss_like_sigma + ", data):\n";
    likefunction += "  " + theta.join() + " theta\n"; // unpack theta
    likefunction += "  md = mymodel(" + theta.join() + "," + abscissastring + ")\n"; // get model
    if ( $("#likelihood_input_type").val() == "Gaussian" ){
      likefunction += "  return -0.5*np.sum(((md - data)/sigma_gauss)**2)\n\n";
    }
    else if( $("#likelihood_input_type").val() == "Studentst" ){
      likefunction += "  nu = 0.5*len(md) # number of degrees of freedom\n";
      likefunction += "  return -nu*log(np.sum((md - data)**2))\n\n";
    }

    pyfile += likefunction;

    // generate a unique output directory for the file and data
    var outdir = guuid();

    // object to output the data
    var outputdata = {};
    outputdata['outdir'] = outdir;

    outputdata['pyfile'] = pyfile; // the python file

    // get abscissa data
    if( $("#id_abscissa_"+abscissavar).val() == "Input" ){
      // check all values are numbers
      var abscissa_data = ($("#id_abscissaval").val()).split(',');
      for ( index = 0; index < abscissa_data.length; index++ ){
        if ( !isNumber(abscissa_data[index]) ){
          alert("Non-number value in independent variable/abscissa data");
          return false;
        }
      }
      outputdata['abscissa_data'] = abscissa_data;
    }

    // upload abscissa data
    if( $("#id_abscissa_"+abscissavar).val() == "Upload" ){
      var abscissaformData = new FormData();
      var abfile = $("#id_abscissafile")[0].files[0];
      abscissaformData.append('file', abfile);
      abscissaformData.append('labelab', 'abscissafile');
      abscissaformData.append('outdirab', outdir);

      // have file size limit of 500kb
      if ( abfile.size/1024.0 > 500 ){
        alert("Independent variable/abscissa file size is too large");
        return false;
      }

      $.ajax({
        method: 'POST',
        data: abscissaformData,
        processData: false,  // tell jQuery not to process the data
        contentType: false,  // tell jQuery not to set contentType
        success: function(data){
          //
        }
      }).done(function(data){
        console.log( data );
      });
    }

    // read in input data
    if ( $("#data_input_type").val() == "Input" ){ // get input data
      // check all values are numbers
      var input_data = ($(data_form_id).val()).split(',');
      for ( index = 0; index < input_data.length; index++ ){
        if ( !isNumber(input_data[index]) ){
          alert("Non-number value in input data");
          return false;
        }
      }
      outputdata['input_data'] = input_data;
    }

    // upload abscissa data
    if( $("#data_input_type").val() == "Upload" ){
      var inputformData = new FormData();
      var dtfile = $(data_form_id)[0].files[0];
      inputformData.append('file', dtfile);
      inputformData.append('labeldt', 'datafile');
      inputformData.append('outdirdt', outdir);

      // have file size limit of 500kb
      if ( dtfile.size/1024.0 > 500 ){
        alert("Data file size is too large");
        return false;
      }

      $.ajax({
        method: 'POST',
        data: inputformData,
        processData: false,  // tell jQuery not to process the data
        contentType: false,  // tell jQuery not to set contentType
        success: function(data){
          //
        }
      }).done(function(data){
        console.log( data );
      });
    }

    // check for input sigma values (rather than a single value)
    if ( $("#id_gauss_like_type").val() == "Known2" ){
      if( $("#id_gauss_known2_type").val() == "Input" ){
        // check all values are numbers
        var sigma_data = ($("#id_gauss_like_sigma_input").val()).split(',');
        for ( index = 0; index < sigma_data.length; index++ ){
          if ( !isNumber(sigma_data[index]) ){
            alert("Non-number value in sigma input data");
            return false;
          }
        }
        outputdata['sigma_data'] = sigma_data;
      }

      if( $("#id_gauss_known2_type").val() == "Upload" ){
        var siformData = new FormData();
        var sifile = $("#id_gauss_like_sigma_upload")[0].files[0];
        siformData.append('file', sifile);
        siformData.append('labelsi', 'sigmafile');
        siformData.append('outdirsi', outdir);

        // have file size limit of 500kb
        if ( sifile.size/1024.0 > 500 ){
          alert("Data file size is too large");
          return false;
        }

        $.ajax({
          method: 'POST',
          data: siformData,
          processData: false,  // tell jQuery not to process the data
          contentType: false,  // tell jQuery not to set contentType
          success: function(data){
            //
          }
        }).done(function(data){
          console.log( data );
        });
      }
    }

    // need to add inputs for MCMC - number of ensemble samples, burn-in and MCMC interations

    // set up initial points from prior

    // set MCMC to run

    // output chain and log probabilities to file

    // run a pre-written script to parse the output, create plots and an output webpage and email user


    // submit final data (python file and any inputs)
    $.ajax({
      method: 'POST',
      data: outputdata,
      success: function(data){
        alert("Successfully submitted data");
      }
    });
  });

  // function to get minimum and maximum values based on tag ids
  function getMinMaxValues(idminval, idmaxval){
    var minval = $(idminval).val();
    if ( minval != "Min." ){
      $(idminval).css("color", "black");

      if ( !isNumber(minval) ){
        alert("Minimum value is not a number");
        $(idminval).css("color", "red");
        $(idminval).val("Invalid value");
        return [];
      }
    }
    else{
      alert("Minimum value not specified");
      $(idminval).css("color", "red");
      $(idminval).val("Invalid value");
      return [];
    }

    var maxval = $(idmaxval).val();
    if ( maxval != "Max." ){
      $(idmaxval).css("color", "black");

      if ( isNumber(maxval) ){
        // check max val is greater than min val
        if ( parseFloat( maxval ) < parseFloat( minval ) ){
          alert("Maximum value is less than minimum value!");
          $(idminval).css("color", "red");
          $(idminval).val("Invalid value");
          return [];
        }
      }
      else{
        alert("Maximum value is not a number");
        $(idmaxval).css("color", "red");
        $(idmaxval).val("Invalid value");
        return [];
      }
    }
    else{
      alert("Maximum value not specified");
      $(idmaxval).css("color", "red");
      $(idmaxval).val("Invalid value");
      return [];
    }

    return [minval, maxval];
  }

  // function to get mean and sigma values for a Gaussian prior
  function getGaussianValues(idmeanval, idsigmaval){
    var meanval = $(idmeanval).val();
    var sigmaval = $(idsigmaval).val();

    // check and get mean and sigma values
    if ( meanval != "Mean" ){          
      if ( isNumber( meanval ) ){
       $(idmeanval).css("color", "black"); 

       if ( sigmaval != "Standard deviation" ){
          $(idsigmaval).css("color", "black");

          if ( isNumber( sigmaval ) ){
            if ( sigmaval < 0. ){
              alert("Standard devaition must be a positive number");
              $(idsigmaval).css("color", "red");
              $(idsigmaval).val("Invalid value");
              return [];
            }
          }
          else{
            alert("Standard deviation value is not a number");
            $(idsigmaval).css("color", "red");
            $(idsigmaval).val("Invalid value");
            return [];
          }
        }
        else{
          alert("Standard deviation value not specified");
          $(idsigmaval).css("color", "red");
          $(idsigmaval).val("Invalid value");
          return [];
        }
      }
      else{
        alert("Mean value is not a number");
        $(idmeanval).css("color", "red");
        $(idmeanval).val("Invalid value");
        return [];
      }
    }
    else{
      alert("Mean value not specified for Gaussian prior");
      $(idmeanval).css("color", "red");
      $(idmeanval).val("Invalid value");
      return [];
    }

    return [meanval, sigmaval];
  }

  // function to check if string is number (from http://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric)
  function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  // function to generate a UUID (from http://stackoverflow.com/questions/12223529/create-globally-unique-id-in-javascript?lq=1) 
  function guuid() {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    return (S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4());
  };
});

