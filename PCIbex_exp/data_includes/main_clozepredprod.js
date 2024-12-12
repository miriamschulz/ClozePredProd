// Cloze prediction & production experiment
// Miriam Schulz (mschulz@lst.uni-saarland.de)
// November 2024


PennController.ResetPrefix(null);
DebugOff()

Sequence(//"preload_trials",
         //"welcome",
         //"consent",

         "init_record",
         //"recording_test",            // (new version)
         //"sendAsync", // send first recording from the audio test
         //"demographics",

         // Block 1: Comprehension
         "instructions_comp1",
         "instructions_comp_examples",
         "instructions_comp2",
         "practice_comp",
         "transition_comp",
         seq("comprehension"),
         // randomizeNoMoreThan(anyOf("comp_high",
         //                           "comp_low",
         //                           "comp_filler2"), 1),

         // Block transition
         "transition_blocks",

         // Block 2: Production
         "instructions_prod1",
         "instructions_prod_good_examples",
         "instructions_prod2",
         "instructions_prod_bad_examples",
         "instructions_prod3",
         "instructions_prod_final_example",
         "instructions_prod4",
         seq("practice_prod"),
         "transition_prod",
         sepWith("sendAsync", seq("production")),
         "syncUpload",  // upload last trial

         // Post-experimental survey + send results
         "transition_survey",
         "postexp_survey",
         SendResults(),
         "prolific_code"
);

// Create a unique ID per participant as a variable (to append to results + recordings)
id = ("0000" + ((Math.random() * Math.pow(36, 8)) | 0).toString(36)).slice(-6);

// Set Latin list manually
// var counterOverride = 0;  // 0 runs list 1; 1 runs list 2; etc.

// Change the label on the progress bar
var progressBarText = "Progress";

// Wait until all audio files etc. are preloaded
CheckPreloaded()
    .label("preload_trials")

////////////////////////////////////////////////////////////////////////////////
//////////////////////////////  GLOBAL DEFAULTS   //////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Set default formatting for some elements
// and define some global variables
Header(
    // Define a global variable for debugging mode (true: 1, false: 0)
    // (this allows to print extra information during debugging)
    newVar("DebugModeTrue", 1).global()
    ,
    // Define a global variable to toggle recording mode on and off
    // (this allows the experiment to be occasionally tested w/o recording)
    newVar("RecordModeTrue", 1).global()
    ,
    // Initiate trial counters
    newVar("TrialCounterGlobal", 0).global()
    ,
    newVar("TrialCounterComprehension", 0).global()
    ,
    newVar("TrialCounterProduction", 0).global()
    ,
    // Initiate an accuracy list variable to track comprehension accuracy
    newVar("ComprehensionAccuracyVar", []).global()  // define a global accuracy variable
    ,
    newVar("ComprehensionAccuracyPracVar", []).global()  // define a global accuracy variable
    ,
    newVar("FileName").global().set( v => "" )
    ,
    defaultText
        .cssContainer({"font-size": "20px", "text-align":"center", "padding-top": "16px"})
        .center()
        // .print()
    ,
    defaultButton
        .cssContainer({"height": "35px", "padding-top": "20px", "padding-bottom": "20px"})
        .center()
        .bold()
    ,
    defaultHtml
        // .cssContainer({"width": "35em",  "margin": "0 auto"})
        .center()
        .print()
)
.log("UniqueID", id)  // add the unique ID to every line in the results


////////////////////////////////////////////////////////////////////////////////
//////////////////////////////  SET UP RECORDING  //////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Initiate audio recordings
InitiateRecorder("https://schulz.coli.uni-saarland.de/experiments/clozepredprod/saveRecordings.php",
    "<span style=\"font-size: 20px;\">This experiment collects recording samples from its participants. Your browser should now be prompting a permission request to use your recording device (if applicable).<br><br>By giving your authorization to record, and by participating in this experiment, you are giving permission to the designer(s) of this experiment to anonymously collect the samples recorded during this experiment. The recordings will be uploaded to, and hosted on, a server designated by the experimenter(s). If you accept the request, a label will remain visible at the top of this window throughout the whole experiment, indicating whether you are currently being recorded.</span>").label("init_record");

// Add upload recording commands
UploadRecordings("sendAsync", "noblock").log("UniqueID", id)
UploadRecordings("syncUpload").log("UniqueID", id)


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////  HTML FILES  //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Welcome
PennController("welcome",
    newHtml("welcome", "welcome.html")
    ,
    newButton("Continue")
        .print()
        .wait()
 )
 .log("TrialType", "Survey")

// Consent
PennController("consent",
    newHtml("consent", "consent.html")
        .settings.checkboxWarning("Please agree to participate or close the experiment.")
        .settings.inputWarning("Please enter your Prolific ID to proceed..")
        .log()
        .print()
    ,
    newButton("Continue")
        .center()
        .bold()
        .print()
        // Continue only if the html has been filled in:
        .wait(
              getHtml("consent").test.complete()
                  .failure(  getHtml("consent").warn()  )
        )
)
.log("TrialType", "Survey")

// Demographics
PennController("demographics",
    newHtml("demographics", "demographics.html")
        .settings.inputWarning("Please fill in all the required text fields.")
        .settings.radioWarning("Please specify your gender.")
        .log()
        .print()
    ,
    newButton("Continue")
        // Continue only if the html has been filled in:
        .print()
        .wait(
              getHtml("demographics").test.complete()
                  .failure(  getHtml("demographics").warn()  )
        )
)
.log("TrialType", "Survey")

// Block transition
PennController("transition_blocks",
    newHtml("transition_blocks", "transition_blocks.html")
    ,
    newButton("Continue to the second part")
        .print()
        .wait()
 )
 .log("TrialType", "Survey")

// Transition to post-experimental survey
PennController("transition_survey",
    newHtml("transition_survey", "transition_survey.html")
    ,
    newButton("Continue to survey")
        .print()
        .wait()
 )
 .log("TrialType", "Survey")

// Postexperimental survey
PennController("postexp_survey",
   newHtml("postexp_survey", "postexp_survey.html")
       .log()
       .print()
   ,
   newButton("Proceed to Prolific code")
       .center()
       .bold()
       .print()
       .wait()
)
.log("TrialType", "Survey")

// Prolific code
PennController("prolific_code",
   newHtml("prolific_code", "prolific_code.html")
   ,
   newButton("Finish")
       // .print()
       .wait()
)
.log("TrialType", "Survey")

// Comprehension instructions
PennController("instructions_comp1",
    newHtml("instructions_comp1", "instructions_comp1.html")
        .log()
        .print()
    ,
    // newText("LeftText", "No")
    // ,
    // newText("RightText", "Yes")
    // ,
    // newCanvas(500,150)
    //     .add(100,10, newText("Key D").cssContainer({"font-family": "monospace", "font-size": "20px", "padding": "20px 10px 10px 10px"}))
    //     .add(370,10, newText("Key K").cssContainer({"font-family": "monospace", "font-size": "20px", "padding": "20px 10px 10px 10px"}))
    //     .add(100,60, getText("LeftText").bold().cssContainer(
    //         {"font-family": "monospace", "font-size": "30px", "border": "solid 1px black", "padding": "10px 20px 10px 20px"}))
    //     .add(370,60, getText("RightText").bold().cssContainer(
    //         {"font-family": "monospace", "font-size": "30px", "border": "solid 1px black", "padding": "10px 12px 10px 12px"}))
    //     .log()
    //     .center()
    //     .print()
    // ,
    // // newText("<p>Nach jedem Block erfahren Sie, wie gut Sie die Aufgabe bearbeitet haben.</p>")
    // //     .cssContainer({"font-family": "serif", "font-size": "20px"})
    // //     .left()
    // //     .print()
    // // ,
    // newText("<p>You will now begin with a few practice sentences.</p>")
    //     .cssContainer({"font-size": "20px"})
    //     .left()
    //     .print()
    // ,
    newButton("See examples")
        .print()
        .wait()
 )
 .log("TrialType", "Survey")

// Comprehension instructions 2
PennController("instructions_comp2",
   newHtml("instructions_comp2", "instructions_comp2.html")
       .log()
       .print()
   ,
   newButton("Start practice session")
       .print()
       .wait()
)
.log("TrialType", "Survey")

 // Comprehension transition between practice and main part
 PennController("transition_comp",
     newHtml("transition_comp", "transition_comp.html")
        .log()
        .print()
     ,
     newButton("Start experiment")
         .print()
         .wait()
  )
  .log("TrialType", "Survey")


// Production instructions
PennController("instructions_prod1",
    newHtml("instructions_prod1", "instructions_prod1.html")
    ,
    newButton("See good examples")
        .print()
        .wait()
 )
 .log("TrialType", "Survey")

PennController("instructions_prod2",
    newHtml("instructions_prod2", "instructions_prod2.html")
    ,
    newButton("See bad examples")
        .print()
        .wait()
 )
 .log("TrialType", "Survey")

 newTrial("instructions_prod3",
     newText("Finally, see a good example again.<br><br>")
        .cssContainer({"font-size": "20px"})
          .print()
     ,
     newButton("See a final good example")
         .print()
         .wait()
)
.log("TrialType", "Survey")

//  newTrial("instructions_prod4",
//      newText("Now let's practice!<br><br><b>Remember to use the <u>space bar</u> to see the next word.</b>.<br><br>Please answer a continuation to each sentence.<br>Your answers will not be recorded in the practice session.<br><br>")
//           .cssContainer({"font-size": "20px"})
//           .print()
//      ,
//      newButton("Start practice session")
//          .print()
//          .wait()
// )
// .log("TrialType", "Survey")

PennController("instructions_prod4",
    newHtml("instructions_prod4", "instructions_prod4.html")
    ,
    newButton("Start practice session")
        .print()
        .wait()
 )
 .log("TrialType", "Survey")

 // Production transition between practice and main part
 PennController("transition_prod",
     newHtml("transition_prod", "transition_prod.html")
     ,
     newButton("Start experiment")
         .print()
         .wait()
  )
  .log("TrialType", "Survey")


////////////////////////////////////////////////////////////////////////////////
//////////////////////////////  STIMULI EXAMPLES  //////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Good example
Template(
    GetTable("stimuli_examples.csv")
      .filter( row => row.set == 1 )
    , row =>
    newTrial("instructions_prod_good_examples",
        newController("DashedSentence", {s: row.Sentence, display: "in place", blankText: "#"})
            .cssContainer({"font-family": "monospace", "font-size": "40px"})
            .center()
            .print("center at 50vw", "middle at 40vh")
            .log()
            .wait()
            .remove()
        ,
        // newText("cross","#")
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer1", 800).start().wait()
        // ,
        // getText("cross").remove()
        // ,
        // newText("w1", row.w1)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer2", 300).start().wait()
        // ,
        // getText("w1").remove()
        // ,
        // newTimer("timer3", 230).start().wait()
        // ,
        // newText("w2", row.w2)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer4", 300).start().wait()
        // ,
        // getText("w2").remove()
        // ,
        // newTimer("timer5", 230).start().wait()
        // ,
        // newText("w3", row.w3)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer6", 300).start().wait()
        // ,
        // getText("w3").remove()
        // ,
        // newTimer("timer7", 230).start().wait()
        // ,
        // newText("w4", row.w4)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer8", 300).start().wait()
        // ,
        // getText("w4").remove()
        // ,
        // newTimer("timer9", 230).start().wait()
        // ,
        // newText("w5", row.w5)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer(300)
        //     .start()
        //     .wait()
        // ,
        // getText("w5").remove()
        // ,
        // newTimer("timer10", 230).start().wait()
        // ,
        //
        // newText("w6", row.w6)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer11", 300).start().wait()
        // ,
        // getText("w6")
        //     .remove()
        // ,

        // Blue background
        newFunction("BlueBackground", ()=>$("body").css("background-color", "rgba(173, 216, 230, 0.5)") ).call()
        ,
        newAudio(row.Condition, row.audio)
            .play()
        ,
        newTimer("timer12", 3000)
            .start()
            .wait()
        ,
        newText("ContinueText", "Press Enter to continue.")
            // .cssContainer({"font-size": "30px"})
            .cssContainer({"font-size": "40px", "clear": "both", "line-height": "400%", "color": "red"})
            .print("center at 50vw", "middle at 40vh")
            .center()
            .italic()
        ,
        newKey("ContinueKey", "Enter")
            .wait()
            .log()
        ,
        // Reset the background color
        newFunction("ResetBackgroundWhite", ()=>$("body").css("background-color", "white") ).call()
    )
    .setOption("hideProgressBar", true)
)
.log("TrialType", "Example")


// Bad example
Template(
    GetTable("stimuli_examples.csv")
      .filter( row => row.set == 2 )
    , row =>
    newTrial("instructions_prod_bad_examples",
        newText("ex_note", row.text)
            // .css({"font-size":"25", "text-decoration":"underline"})
            // .print("left at 10vw", "top at 10vh")
            .css({"font-size":"25", "color":"red"})
            .italic()
            .print("top at 10vh")
        ,
        newController("DashedSentence", {s: row.Sentence, display: "in place", blankText: "#"})
            .cssContainer({"font-family": "monospace", "font-size": "40px"})
            .center()
            .print("center at 50vw", "middle at 40vh")
            .log()
            .wait()
            .remove()
        ,
        // newText("cross","#")
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer1", 800).start().wait()
        // ,
        // getText("cross").remove()
        // ,
        // newText("w1", row.w1)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer2", 300).start().wait()
        // ,
        // getText("w1").remove()
        // ,
        // newTimer("timer3", 230).start().wait()
        // ,
        // newText("w2", row.w2)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer4", 300).start().wait()
        // ,
        // getText("w2").remove()
        // ,
        // newTimer("timer5", 230).start().wait()
        // ,
        // newText("w3", row.w3)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer6", 300).start().wait()
        // ,
        // getText("w3").remove()
        // ,
        // newTimer("timer7", 230).start().wait()
        // ,
        // newText("w4", row.w4)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer8", 300).start().wait()
        // ,
        // getText("w4").remove()
        // ,
        // newTimer("timer9", 230).start().wait()
        // ,
        // newText("w5", row.w5)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer(300)
        //     .start()
        //     .wait()
        // ,
        // getText("w5").remove()
        // ,
        // newTimer("timer10", 230).start().wait()
        // ,
        // newText("w6", row.w6)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer11", 300).start().wait()
        // ,
        // getText("w6")
        //     .remove()
        // ,

        // Blue background
        newFunction("BlueBackground", ()=>$("body").css("background-color", "rgba(173, 216, 230, 0.5)") ).call()
        ,
        newAudio(row.Condition, row.audio)
            .play()
        ,
        newTimer("timer12", 3000)
            .start()
            .wait()
        ,
        newText("ContinueText", "Press Enter to continue.")
            .cssContainer({"font-size": "30px"})
            .print("center at 50vw", "middle at 40vh")
            .center()
            .italic()
        ,
        newKey("ContinueKey", "Enter")
            .wait()
            .log()
        ,
        // Reset the background color
        newFunction("ResetBackgroundWhite", ()=>$("body").css("background-color", "white") ).call()
    )
    .setOption("hideProgressBar", true)
)
.log("TrialType", "Example")

// Final example
Template(
    GetTable("stimuli_examples.csv")
      .filter( row => row.set == 3 )
    , row =>
    newTrial("instructions_prod_final_example",
        newController("DashedSentence", {s: row.Sentence, display: "in place", blankText: "#"})
            .cssContainer({"font-family": "monospace", "font-size": "40px"})
            .center()
            .print("center at 50vw", "middle at 40vh")
            .log()
            .wait()
            .remove()
        ,
        // newText("cross","#")
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     // .css({"font-size":"40"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer1", 800).start().wait()
        // ,
        // getText("cross").remove()
        // ,
        // newText("w1", row.w1)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     // .css({"font-size":"40"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer2", 300).start().wait()
        // ,
        // getText("w1").remove()
        // ,
        // newTimer("timer3", 230).start().wait()
        // ,
        // newText("w2", row.w2)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     // .css({"font-size":"40"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer4", 300).start().wait()
        // ,
        // getText("w2").remove()
        // ,
        // newTimer("timer5", 230).start().wait()
        // ,
        // newText("w3", row.w3)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     // .css({"font-size":"40"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer6", 300).start().wait()
        // ,
        // getText("w3").remove()
        // ,
        // newTimer("timer7", 230).start().wait()
        // ,
        // newText("w4", row.w4)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     // .css({"font-size":"40"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer8", 300).start().wait()
        // ,
        // getText("w4").remove()
        // ,
        // newTimer("timer9", 230).start().wait()
        // ,
        // newText("w5", row.w5)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     // .css({"font-size":"40"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer(300)
        //     .start()
        //     .wait()
        // ,
        // getText("w5").remove()
        // ,
        // newTimer("timer10", 230).start().wait()
        // ,
        //
        // newText("w6", row.w6)
        //     .cssContainer({"font-family": "monospace", "font-size": "40px"})
        //     // .css({"font-size":"40"})
        //     .print("center at 50vw", "middle at 40vh")
        // ,
        // newTimer("timer11", 300).start().wait()
        // ,
        // getText("w6")
        //     .remove()
        // ,

        // Blue background
        newFunction("BlueBackground", ()=>$("body").css("background-color", "rgba(173, 216, 230, 0.5)") ).call()
        ,
        newAudio(row.Condition, row.audio)
            .play()
        ,
        newTimer("timer12", 3000)
            .start()
            .wait()
        ,
        newText("ContinueText", "Press Enter to continue.")
            .cssContainer({"font-size": "30px"})
            .print("center at 50vw", "middle at 40vh")
            .center()
            .italic()
        ,
        newKey("ContinueKey", "Enter")
            .wait()
            .log()
        ,
        // Reset the background color
        newFunction("ResetBackgroundWhite", ()=>$("body").css("background-color", "white") ).call()
    )
    .setOption("hideProgressBar", true)
)
.log("TrialType", "Example")


// Comprehension example
Template(
    GetTable("stimuli_examples.csv")
      .filter( row => row.set == 4 )
    , row =>
    newTrial("instructions_comp_examples",
        newController("DashedSentence", {s: row.Sentence, display: "in place", blankText: "#"})
            .cssContainer({"font-family": "monospace", "font-size": "40px"})
            .center()
            .print("center at 50vw", "middle at 40vh")
            .log()
            .wait()
            .remove()
        ,
        newText("ComprehensionQuestion", row.Question)
        ,
        newText("LeftText", "No")
        ,
        newText("RightText", "Yes")
        ,
        newText("LeftKeyText", "Key D")
        ,
        newText("RightKeyText", "Key K")
        ,
        newCanvas("ComprehensionCanvas", 400,300)
            .add("center at 50%", 20, getText("ComprehensionQuestion").italic().cssContainer({"font-family": "monospace",  "font-size": "25px"}))
            .add(30, 150, getText("LeftKeyText").cssContainer( {"font-family": "monospace", "font-size": "20px", "padding": "20px 10px 10px 10px"}))
            .add(300,150, getText("RightKeyText").cssContainer({"font-family": "monospace", "font-size": "20px", "padding": "20px 10px 10px 10px"}))
            .add(30, 200, getText("LeftText").bold().cssContainer(
                {"font-family": "monospace", "font-size": "30px", "border": "solid 1px black", "padding": "10px 20px 10px 20px"}))
            .add(300,200, getText("RightText").bold().cssContainer(
                {"font-family": "monospace", "font-size": "30px", "border": "solid 1px black", "padding": "10px 12px 10px 12px"}))
            .center()
            .print()
        ,
        newTimer("SimulatedDecisionTimer", 1000)
            .start()
            .wait()
        ,
        getCanvas("ComprehensionCanvas")
            .remove()
        ,
        newCanvas("ComprehensionCanvasDecided", 400,300)
        ,
        newText("Answer", row.Answer)
            .test.text("D")
                .success(
                    getCanvas("ComprehensionCanvasDecided")
                        .add("center at 50%", 20, getText("ComprehensionQuestion").italic().cssContainer({"font-family": "monospace",  "font-size": "25px"}))
                        .add(30, 150, getText("LeftKeyText").cssContainer( {"font-family": "monospace", "font-size": "20px", "color": "green", "padding": "20px 10px 10px 10px"}))
                        .add(300,150, getText("RightKeyText").cssContainer({"font-family": "monospace", "font-size": "20px",  "color": "black", "padding": "20px 10px 10px 10px"}))
                        .add(30, 200, getText("LeftText").bold().cssContainer({"font-family": "monospace", "font-size": "30px", "border": "solid 1px green", "padding": "10px 20px 10px 20px", "color": "green"}))
                        .add(300,200, getText("RightText").bold().cssContainer({"font-family": "monospace", "font-size": "30px", "border": "solid 1px black", "padding": "10px 12px 10px 12px", "color": "black"}))
                        .center()
                        .print()
                )
                .failure(
                    getCanvas("ComprehensionCanvasDecided")
                        .add("center at 50%", 20, getText("ComprehensionQuestion").italic().cssContainer({"font-family": "monospace",  "font-size": "25px"}))
                        .add(30, 150, getText("LeftKeyText").cssContainer( {"font-family": "monospace", "font-size": "20px", "color": "black", "padding": "20px 10px 10px 10px"}))
                        .add(300,150, getText("RightKeyText").cssContainer({"font-family": "monospace", "font-size": "20px",  "color": "green", "padding": "20px 10px 10px 10px"}))
                        .add(30 ,200, getText("LeftText").bold().cssContainer({"font-family": "monospace", "font-size": "30px", "border": "solid 1px black", "padding": "10px 20px 10px 20px", "color": "black"}))
                        .add(300,200, getText("RightText").bold().cssContainer({"font-family": "monospace", "font-size": "30px", "border": "solid 1px green", "padding": "10px 12px 10px 12px", "color": "green"}))
                        .center()
                        .print()
                )
        ,
        newTimer("DisplayTimer", 1500)
            .start()
            .wait()
        ,
        newText("ContinueText", "Press Enter to continue.")
            .cssContainer({"font-size": "30px"})
            .print()
            .center()
            .italic()
        ,
        newKey("ContinueKey", "Enter")
            .wait()
      )
    .setOption("hideProgressBar", true)
)
.log("TrialType", "Example")


////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////  AUDIO TEST  /////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


// PennController("audiotest",
//     newHtml("audiotest", "audiotest.html")
//     ,
//     getVar("RecordModeTrue")
//         .test.is(1)
//         .failure(
//               newButton("ContinueButtonNoRecord", "Continue")
//                   .print()
//                   .wait()
//         )
//         .success(
//             newButton("startrecording", "Start recording")
//                 .print()
//                 .wait()
//             ,
//             getButton("startrecording").remove()
//             ,
//             newImage("recordingicon", "recordingicon.png")
//                 .center()
//                 .size(50,50)
//                 .print()
//             ,
//             // newText("emptySpace", "")  // empty vertical space
//             // ,
//             newButton("stoprecording", "End recording").print()
//             ,
//             newMediaRecorder("recorder"+"_"+id+"_"+"mictest", "audio").record()
//             ,
//             getButton("stoprecording")
//                 .wait()
//                 .remove()
//             ,
//             getImage("recordingicon").remove()
//             ,
//             newTimer("timer1", 300)
//                 .start()
//                 .wait()
//             ,
//             newImage("audioicon", "audioicon.png")
//                 .center()
//                 .size(50,50)
//                 .print()
//             ,
//             getMediaRecorder("recorder"+"_"+id+"_"+"mictest")
//                 .stop()
//                 .disable()
//                 .play()
//                 .wait("playback")
//             ,
//             getImage("audioicon").remove()
//             ,
//             getMediaRecorder("recorder"+"_"+id+"_"+"mictest").stop()
//             ,
//             newTimer("timer2", 500)
//                 .start()
//                 .wait()
//             ,
//             newText("retryText", "<span style=\"color: green;\">If your microfone check was successful, please press \"Y\" on your keyboard to proceed.</span><br><br><span style=\"color: red;\">Otherwise, please ensure that your speakers and microfone are<br>switched on and press \"N\" on your keyboard to retry.</span>")
//                 .cssContainer({"font-weight": "bold", "text-align":"center", "padding-top": "10px", "padding-bottom": "10px"})
//                 .print()
//             ,
//             newKey("RetryKey", "YN")
//                 .log()
//                 .wait()
//             ,
//             getText("retryText").remove()
//             ,
//             getKey("RetryKey")
//                 .test.pressed("Y")
//                 .failure(
//                     getButton("startrecording").print().wait(),
//                     getButton("startrecording").remove(),
//                     getImage("recordingicon").print(),
//                     // getText("emptySpace").print(),
//                     getButton("stoprecording").print(),
//                     newMediaRecorder("recorder"+"_"+id+"_"+"mictest_attempt2", "audio").record(),
//                     getButton("stoprecording").wait().remove(),
//                     getImage("recordingicon").remove(),
//                     newTimer("timer3", 300).start().wait(),
//                     getImage("audioicon").print(),
//                     getMediaRecorder("recorder"+"_"+id+"_"+"mictest_attempt2")
//                         .stop()
//                         .disable()
//                         .play()
//                         .wait("playback")
//                     ,
//                     getImage("audioicon").remove(),
//                     getMediaRecorder("recorder"+"_"+id+"_"+"mictest_attempt2").stop(),
//                     newTimer("timer4", 500).start().wait(),
//                     newText("retryText2", "<span style=\"color: green;\">If the microfone test was successful this time and you heard your recording, please press \"Y\" on your keyboard to proceed.</span><br><br><span style=\"color: red;\">Otherwise, please ensure again that your speakers and microfone are turned on and press \"N\" on your keyboard for a final attempt.<\span>")
//                          .cssContainer({"font-weight": "bold", "text-align":"center", "padding-top": "10px", "padding-bottom": "10px"})
//                          .print()
//                     ,
//                     newKey("RetryKey2", "YN")
//                         .log()
//                         .wait()
//                     ,
//                     getText("retryText2").remove()
//                     ,
//                     getKey("RetryKey2")
//                         .test.pressed("Y")
//                         .failure(
//                             getButton("startrecording").print().wait(),
//                             getButton("startrecording").remove(),
//                             getImage("recordingicon").print(),
//                             // getText("emptySpace").print(),
//                             getButton("stoprecording").print(),
//                             newMediaRecorder("recorder"+"_"+id+"_"+"mictest_attempt3", "audio").record(),
//                             getButton("stoprecording").wait().remove(),
//                             getImage("recordingicon").remove(),
//                             newTimer("timer5", 300).start().wait(),
//                             getImage("audioicon").print(),
//                             getMediaRecorder("recorder"+"_"+id+"_"+"mictest_attempt3")
//                                 .stop()
//                                 .disable()
//                                 .play()
//                                 .wait("playback")
//                             ,
//                             getImage("audioicon").remove(),
//                             getMediaRecorder("recorder"+"_"+id+"_"+"mictest_attempt3").stop(),
//                             newTimer("timer6", 500).start().wait(),
//                             newText("retryText3", "<span style=\"color: green;\">If the microfone test was successful this time and you heard your recording, please press \"Continue\" below.<\span><br><br><span style=\"color: red;\">Otherwise please close the experiment as there seem to be non-solvable microfone and/or audio issues.<\span>")
//                                 .cssContainer({"font-weight": "bold", "text-align":"center", "padding-top": "10px", "padding-bottom": "10px"})
//                                 .print()
//                             ,
//                             newButton("Continue").print().wait()
//                         )
//                     )
//         )
// )
// .log("TrialType", "Survey")



newTrial("recording_test",
    newText("This experiment involves audio recording. Before you start the experiment, please test your recording.")
        .cssContainer({"text-align": "justify", "font-size": "20px"})
        .bold()
        .print()
    ,
    newText("Please record yourself saying the sentence 'This is a test' (this recording will be saved). To start the recording, press the \"Record\" button. To stop the recording, press \"Stop\". To test whether your voice was recorded, click the play button.<br><br>")
    .cssContainer({"text-align": "justify", "font-size": "20px"})
        .print()
    ,
    newMediaRecorder("test_recorder" + "_" + id, "audio")
        .print()
    ,
    newText("<br>Make sure you can hear your voice clearly in the playback before you continue.<br><br>During the experiment, recordings will start and stop automatically. There is a notification at the top of the page that will indicate when audio is being recorded.<br><br>")
    .cssContainer({"text-align": "justify", "font-size": "20px"})
        .print()
    ,
    newButton("Click here to continue")
        .print()
        .wait(
            getMediaRecorder("test_recorder" + "_" + id).test.recorded()
                .failure(
                    newText("Please test your audio recording before continuing.")
                        .cssContainer({"font-weight": "bold", "color": "red"})
                        .print()
                )
    )
)



////////////////////////////////////////////////////////////////////////////////
//////////////////////////////  PRACTICE TRIALS  ///////////////////////////////
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
//// Comprehension practice

Template(
    GetTable("practice.csv")
      .filter( row => row.ExpCondition == "prac_comprehension")
    , row =>
    newTrial("practice_comp",

        //// Initialize trial ////

        getVar("TrialCounterGlobal").set(v => v + 1)  // Increase trial counter with each trial
        ,

        //// Start trial ////

        newController("DashedSentence", {s: row.Sentence, display: "in place", blankText: "#"})
            .cssContainer({"font-family": "monospace", "font-size": "40px"})
            .center()
            .print("center at 50vw", "middle at 40vh")
            .log()
            .wait()
            .remove()
        ,
        newText("ComprehensionQuestion", row.Question)
        ,
        newText("LeftText", "No")
        ,
        newText("RightText", "Yes")
        ,
        newText("LeftKeyText", "Key D")
        ,
        newText("RightKeyText", "Key K")
        ,
        newCanvas("ComprehensionCanvas", 400,300)
            // .add(0,0, getText("ComprehensionQuestion").center().italic().cssContainer({"font-family": "monospace", "font-size": "25px", "padding-top": "50px"}))
            // .add(0,  0,   getText("ComprehensionQuestion").center().italic().cssContainer({"font-family": "monospace", "font-size": "25px", "line-height": "270%"}))
            // .add(0,  0,   getText("ComprehensionQuestion").center().italic().cssContainer({"font-family": "monospace", "font-size": "25px"}))
            .add("center at 50%", 20, getText("ComprehensionQuestion").italic().cssContainer({"font-family": "monospace",  "font-size": "25px"}))
            .add(30, 150, getText("LeftKeyText").cssContainer({"font-family": "monospace", "font-size": "20px", "padding": "20px 10px 10px 10px"}))
            .add(300,150, getText("RightKeyText").cssContainer({"font-family": "monospace", "font-size": "20px", "padding": "20px 10px 10px 10px"}))
            .add(30, 200, getText("LeftText").bold().cssContainer(
                {"font-family": "monospace", "font-size": "30px", "border": "solid 1px black", "padding": "10px 20px 10px 20px"}))
            .add(300,200, getText("RightText").bold().cssContainer(
                {"font-family": "monospace", "font-size": "30px", "border": "solid 1px black", "padding": "10px 12px 10px 12px"}))
            .center()
        ,
        newKey("ComprehensionKey", "DK")
        ,
        // Define a variable to store whether the current answer is true/false
        // or "NA" if the trial is not followed by any comprehension question
        newVar("CorrectAnswerVar").global().set( v => "NA" )
        ,
        newText("HasQuestion", row.HasQuestion)
            .test.text("Yes")
                .success(
                    getCanvas("ComprehensionCanvas")
                        .log()
                        .print()
                    ,
                    getKey("ComprehensionKey")
                        .wait()
                        .log()
                    ,
                    getCanvas("ComprehensionCanvas")
                        .remove()
                    ,
                    newCanvas("ComprehensionCanvasDecided", 400,300)
                    ,
                    getKey("ComprehensionKey")
                        .test.pressed(row.Answer)
                            .success(
                                getKey("ComprehensionKey")
                                    .test.pressed("D")
                                        .success(
                                            getCanvas("ComprehensionCanvasDecided")
                                                .add("center at 50%", 20, getText("ComprehensionQuestion").italic().cssContainer({"font-family": "monospace",  "font-size": "25px"}))
                                                .add(30, 150, getText("LeftKeyText").cssContainer( {"font-family": "monospace", "font-size": "20px", "color": "green", "padding": "20px 10px 10px 10px"}))
                                                .add(300,150, getText("RightKeyText").cssContainer({"font-family": "monospace", "font-size": "20px",  "color": "black", "padding": "20px 10px 10px 10px"}))
                                                .add(30, 200, getText("LeftText").bold().cssContainer( {"font-family": "monospace", "font-size": "30px", "border": "solid 1px green", "padding": "10px 20px 10px 20px", "color": "green"}))
                                                .add(300,200, getText("RightText").bold().cssContainer({"font-family": "monospace", "font-size": "30px", "border": "solid 1px black", "padding": "10px 12px 10px 12px", "color": "black"}))
                                                .center()
                                                .print()
                                        )
                                        .failure(
                                            getCanvas("ComprehensionCanvasDecided")
                                                .add("center at 50%", 20, getText("ComprehensionQuestion").italic().cssContainer({"font-family": "monospace",  "font-size": "25px"}))
                                                .add(30, 150, getText("LeftKeyText").cssContainer( {"font-family": "monospace", "font-size": "20px", "color": "black", "padding": "20px 10px 10px 10px"}))
                                                .add(300,150, getText("RightKeyText").cssContainer({"font-family": "monospace", "font-size": "20px",  "color": "green", "padding": "20px 10px 10px 10px"}))
                                                .add(30 ,200, getText("LeftText").bold().cssContainer( {"font-family": "monospace", "font-size": "30px", "border": "solid 1px black", "padding": "10px 20px 10px 20px", "color": "black"}))
                                                .add(300,200, getText("RightText").bold().cssContainer({"font-family": "monospace", "font-size": "30px", "border": "solid 1px green", "padding": "10px 12px 10px 12px", "color": "green"}))
                                                .center()
                                                .print()
                                        )
                                ,
                                newText("CorrectText", "Correct!").cssContainer({"font-family": "monospace", "font-size": "25px", "padding": "10px 10px 10px 10px", "color": "green",  "font-weight": "bold"}).print()
                                ,
                                getVar("ComprehensionAccuracyPracVar").set(v=>[...v,true])
                                ,
                                getVar("CorrectAnswerVar").set( v => true )
                            )
                            .failure(
                                getKey("ComprehensionKey")
                                    .test.pressed("D")
                                        .success(
                                            getCanvas("ComprehensionCanvasDecided")
                                                .add("center at 50%", 20, getText("ComprehensionQuestion").italic().cssContainer({"font-family": "monospace",  "font-size": "25px"}))
                                                .add(30, 150, getText("LeftKeyText").cssContainer( {"font-family": "monospace", "font-size": "20px", "color": "red", "padding": "20px 10px 10px 10px"}))
                                                .add(300,150, getText("RightKeyText").cssContainer({"font-family": "monospace", "font-size": "20px",  "color": "black", "padding": "20px 10px 10px 10px"}))
                                                .add(30, 200, getText("LeftText").bold().cssContainer( {"font-family": "monospace", "font-size": "30px", "border": "solid 1px red", "padding": "10px 20px 10px 20px", "color": "red"}))
                                                .add(300,200, getText("RightText").bold().cssContainer({"font-family": "monospace", "font-size": "30px", "border": "solid 1px black", "padding": "10px 12px 10px 12px", "color": "black"}))
                                                .center()
                                                .print()
                                        )
                                        .failure(
                                            getCanvas("ComprehensionCanvasDecided")
                                                .add("center at 50%", 20, getText("ComprehensionQuestion").italic().cssContainer({"font-family": "monospace",  "font-size": "25px"}))
                                                .add(30, 150, getText("LeftKeyText").cssContainer( {"font-family": "monospace", "font-size": "20px", "color": "black", "padding": "20px 10px 10px 10px"}))
                                                .add(300,150, getText("RightKeyText").cssContainer({"font-family": "monospace", "font-size": "20px",  "color": "red", "padding": "20px 10px 10px 10px"}))
                                                .add(30 ,200, getText("LeftText").bold().cssContainer( {"font-family": "monospace", "font-size": "30px", "border": "solid 1px black", "padding": "10px 20px 10px 20px", "color": "black"}))
                                                .add(300,200, getText("RightText").bold().cssContainer({"font-family": "monospace", "font-size": "30px", "border": "solid 1px red", "padding": "10px 12px 10px 12px", "color": "red"}))
                                                .center()
                                                .print()
                                        )
                                ,
                                newText("IncorrectText", "Incorrect!").cssContainer({"font-family": "monospace", "font-size": "25px", "padding": "10px 10px 10px 10px", "color": "red",  "font-weight": "bold"}).print()
                                ,
                                getVar("ComprehensionAccuracyPracVar").set(v=>[...v,false])
                                ,
                                getVar("CorrectAnswerVar").set( v => false )
                            )
                    ,
                    newTimer("showFeedbackTimer", 1000)
                        .start()
                        .wait()
                    ,
                    getCanvas("ComprehensionCanvasDecided").remove()
                    ,
                    getText("CorrectText").remove()
                    ,
                    getText("IncorrectText").remove()
                )
        ,
        // Compute current accuracy (for debugging)
        newVar("RunningAccuracy")
            .global()
            .set(getVar("ComprehensionAccuracyPracVar")).set(v=>v.filter(a=>a===true).length/v.length)
        ,
        // Define the continuation text and key
        newText("ContinueText", "Press Enter to continue.")
            .cssContainer({"font-size": "30px"})
            .center()
            .italic()
            .print("center at 50vw", "middle at 40vh")
        ,
        newKey("ContinueKey", "Enter")
        ,
        // Print running accuracy (displayed in debug mode only)
        getVar("DebugModeTrue")
            .test.is(1)
            .success(
                newText("Current Accuracy (displayed in debug mode only):").print()
                ,
                newText("RunningAccuracyText").text(getVar("RunningAccuracy"))
                    .print()
            )
        ,
        getKey("ContinueKey")
            .wait()
    )
    // Basic trial information
    .log("LatinList", row.group)  //TODO update with the actual Latin list?
    .log("Block", "ComprehensionPractice")
    .log("ExpItemNum", row.ItemNum)
    .log("ExpItemType", row.Type)
    .log("ExpCondition", row.ExpCondition)
    .log("TargetPosition", row.TargetPosition)
    .log("TargetWord", row.TargetWord)
    .log("TargetFreq", row.Lg10WF)
    .log("SentenceEnd", row.End)
    .log("TrialCounterGlobal", getVar("TrialCounterGlobal"))
    .log("TrialCounterBlock", "NA")
    // Comprehension trial information
    .log("TargetAnswer_RecordingFilename", row.Answer)
    .log("QuestionText_ProductionTime", row.Question)
    .log("CorrectAnswer_ProductionTimeout", getVar("CorrectAnswerVar"))
    .log("RunningAccuracy", getVar("RunningAccuracy"))
)


////////////////////////////////////////////////////////////////////////////////
//// Production practice
Template(
    GetTable("practice.csv")
      .filter( row => row.ExpCondition == "prac_production")
    , row =>
    newTrial("practice_prod",

        //// Initialize trial ////

        getVar("TrialCounterGlobal").set(v => v + 1)  // Increase trial counter with each trial
        ,
        newVar("ProductionTimeoutVar").global().set( v => "NoTimeOut" )
        ,

        //// Start trial ////

        newController("DashedSentence", {s: row.Sentence, display: "in place", blankText: "#"})
            .cssContainer({"font-family": "monospace", "font-size": "40px"})
            .center()
            .print("center at 50vw", "middle at 40vh")
            .log()
            .wait()
            .remove()
        ,
        newFunction("BlueBackground", ()=>$("body").css("background-color", "rgba(173, 216, 230, 0.5)") ).call()
        ,
        newVar("ProductionTime").global().set( v => Date.now() )  // start timer
        ,
        newKey("StopRecordingKey", "Enter")
            .log()
            // .wait()
            .callback(
                getTimer("ProductionTimeoutTimer").stop()
            )
        ,
        newTimer("ProductionTimeoutTimer", 4000)  // production timer: 4 sec
            .start()
            .wait()
        ,
        getVar("ProductionTime").set(v => Date.now() - v) // Calculate the elapsed time
        ,
        getKey("StopRecordingKey")
            .test.pressed()  // test if the key was pressed at all (not true if timer elapsed first)
                .failure( getVar("ProductionTimeoutVar").set(v => "TimedOut" ) )
        ,
        // In debug mode only: print production time and add an extra Enter key
        getVar("DebugModeTrue")
            .test.is(1)
            .success(
                // Reset background color
                newFunction("ResetBackgroundWhiteDebug", ()=>$("body").css("background-color", "white") ).call()
                ,
                newText("Production time (displayed in debug mode only, in ms):")
                    .print()
                ,
                newText("ProdTimeText").text(getVar("ProductionTime"))
                    .print()
            )
        ,
        // Reset the background color at the end of the trial
        newFunction("ResetBackgroundWhite", ()=>$("body").css("background-color", "white") ).call()
        ,
        getVar("ProductionTimeoutVar")
            .test.is("TimedOut")
                .success(
                  newText("ProductionTimeoutMessage", "<b>Too slow!</b><br>Remember to finish the sentence with about 1 to 2 words<br>when the screen turns blue and to press <b>ENTER</b> when done.")
                      .cssContainer({"color": "red", "font-size": "25px"})
                      .print()
                  ,
                  newTimer("DummyTimer", 1000)
                      .start()
                      .wait()
                )
        ,
        newText("ContinueText", "Press Enter to continue.")
            .cssContainer({"font-size": "30px"})
            .print("center at 50vw", "middle at 40vh")
            .center()
            .italic()
        ,
        newKey("ContinueKey", "Enter")
            .wait()
            .log()
    )
    // Basic trial information
    .log("LatinList", row.group)  //TODO update with the actual Latin list?
    .log("Block", "ProductionPractice")
    .log("ExpItemNum", row.ItemNum)
    .log("ExpItemType", row.Type)
    .log("ExpCondition", row.ExpCondition)
    .log("TargetPosition", row.TargetPosition)
    .log("TargetWord", row.TargetWord)
    .log("TargetFreq", row.Lg10WF)
    .log("SentenceEnd", row.End)
    .log("TrialCounterGlobal", getVar("TrialCounterGlobal"))
    .log("TrialCounterBlock", "NA")
    // Production trial information
    .log("TargetAnswer_RecordingFilename", "NA")
    .log("QuestionText_ProductionTime", getVar("ProductionTime"))
    .log("CorrectAnswer_ProductionTimeout", getVar("ProductionTimeoutVar"))
    .log("RunningAccuracy", "NA")
)


////////////////////////////////////////////////////////////////////////////////
////////////////////////////  EXPERIMENTAL TRIALS  /////////////////////////////
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
//// Comprehension block
Template("comprehension_l1_pseudorandomized.csv", row =>
    newTrial("comprehension",

        //// Initialize trial ////

        getVar("TrialCounterGlobal").set(v => v + 1)  // Increase trial counter with each trial
        ,

        getVar("TrialCounterComprehension").set(v => v + 1)  // Increase trial counter with each trial
        ,

        //// Start trial ////

        newController("DashedSentence", {s: row.Sentence, display: "in place", blankText: "#"})
            .cssContainer({"font-family": "monospace", "font-size": "40px"})
            .center()
            .print("center at 50vw", "middle at 40vh")
            .log()
            .wait()
            .remove()
        ,
        newText("ComprehensionQuestion", row.Question)
        ,
        newText("LeftText", "No")
        ,
        newText("RightText", "Yes")
        ,
        newCanvas("ComprehensionCanvas", 400,300)
            .add("center at 50%", 20, getText("ComprehensionQuestion").italic().cssContainer({"font-family": "monospace",  "font-size": "25px"}))
            .add(30, 150, newText("Key D").cssContainer({"font-family": "monospace", "font-size": "20px", "padding": "20px 10px 10px 10px"}))
            .add(300,150, newText("Key K").cssContainer({"font-family": "monospace", "font-size": "20px", "padding": "20px 10px 10px 10px"}))
            .add(30, 200, getText("LeftText").bold().cssContainer(
                {"font-family": "monospace", "font-size": "30px", "border": "solid 1px black", "padding": "10px 20px 10px 20px"}))
            .add(300,200, getText("RightText").bold().cssContainer(
                {"font-family": "monospace", "font-size": "30px", "border": "solid 1px black", "padding": "10px 12px 10px 12px"}))
            .center()
        ,
        newKey("ComprehensionKey", "DK")
        ,
        // Define a variable to store whether the current answer is true/false
        // or "NA" if the trial is not followed by any comprehension question
        newVar("CorrectAnswerVar").global().set( v => "NA" )
        ,
        newText("HasQuestion", row.HasQuestion)
            .test.text("Yes")
                .success(
                    getCanvas("ComprehensionCanvas")
                        .log()
                        .print()
                    ,
                    getKey("ComprehensionKey")
                        .wait()
                        .log()
                        // .test.pressed(row.Answer)
                        // .success( getVar("ComprehensionAccuracyVar").set(v=>[...v,true]) )
                        // .failure( getVar("ComprehensionAccuracyVar").set(v=>[...v,false]) )
                        .test.pressed(row.Answer)
                            .success(
                                // newText("CorrectText", "Correct!").cssContainer({"font-family": "monospace", "font-size": "25px", "padding": "10px 10px 10px 10px", "color": "green",  "font-weight": "bold"}).print()
                                // ,
                                getVar("ComprehensionAccuracyVar").set(v=>[...v,true])
                                ,
                                getVar("CorrectAnswerVar").set( v => true )
                            )
                            .failure(
                                // newText("IncorrectText", "Incorrect!").cssContainer({"font-family": "monospace", "font-size": "25px", "padding": "10px 10px 10px 10px", "color": "red",  "font-weight": "bold"}).print()
                                // ,
                                getVar("ComprehensionAccuracyVar").set(v=>[...v,false])
                                ,
                                getVar("CorrectAnswerVar").set( v => false )
                            )

                    ,
                    getCanvas("ComprehensionCanvas").remove()
                    // ,
                    // getText("CorrectText").remove()
                    // ,
                    // getText("IncorrectText").remove()
                )
        ,
        // Compute current accuracy (for debugging)
        newVar("RunningAccuracy")
            .global()
            .set(getVar("ComprehensionAccuracyVar")).set(v=>v.filter(a=>a===true).length/v.length)
        ,
        // Define the continuation text and key
        newText("ContinueText", "Press Enter to continue.")
            .cssContainer({"font-size": "30px"})
            .center()
            .italic()
            .print("center at 50vw", "middle at 40vh")
        ,
        newKey("ContinueKey", "Enter")
        ,
        // Print running accuracy (displayed in debug mode only)
        getVar("DebugModeTrue")
            .test.is(1)
            .success(
                getText("HasQuestion")
                    .test.text("Yes")
                    .success(
                        getKey("ComprehensionKey")
                            .test.pressed(row.Answer)
                                .success(newText("Correct!").cssContainer({"font-family": "monospace", "font-size": "25px", "padding": "10px 10px 10px 10px", "color": "green",  "font-weight": "bold"}).print())
                                .failure(newText("Incorrect!").cssContainer({"font-family": "monospace", "font-size": "25px", "padding": "10px 10px 10px 10px", "color": "red",  "font-weight": "bold"}).print())
                        ,
                        newText("Current Accuracy (displayed in debug mode only):").print()
                        ,
                        newText("RunningAccuracyText").text(getVar("RunningAccuracy"))
                            .print()
                    )
            )
        ,
        getKey("ContinueKey")
            .wait()
    )
    // Basic trial information
    .log("LatinList", row.Group)
    .log("Block", "Comprehension")
    .log("ExpItemNum", row.ItemNum)
    .log("ExpItemType", row.Type)
    .log("ExpCondition", row.ExpCondition)
    .log("TargetPosition", row.TargetPosition)
    .log("TargetWord", row.TargetWord)
    .log("TargetFreq", row.Lg10WF)
    .log("SentenceEnd", row.End)
    .log("TrialCounterGlobal", getVar("TrialCounterGlobal"))
    .log("TrialCounterBlock", getVar("TrialCounterComprehension"))
    // Comprehension trial information
    .log("TargetAnswer_RecordingFilename", row.Answer)
    .log("QuestionText_ProductionTime", row.Question)
    .log("CorrectAnswer_ProductionTimeout", getVar("CorrectAnswerVar"))
    .log("RunningAccuracy", getVar("RunningAccuracy"))
)


////////////////////////////////////////////////////////////////////////////////
// Production block
Template("production_l1_pseudorandomized.csv", row =>
    newTrial("production",

        //// Initialize trial ////

        getVar("TrialCounterGlobal").set(v => v + 1)  // Increase trial counter with each trial
        ,
        getVar("TrialCounterProduction").set(v => v + 1)  // Increase trial counter with each trial
        ,
        newVar("ProductionTimeoutVar").global().set( v => "NoTimeOut" )
        ,
        filename = "recorder_"+id+"_"+row.ItemNum+"_"+row.ExpCondition
        ,
        getVar("FileName").set( filename )
        ,

        //// Start trial ////

        newController("DashedSentence", {s: row.Sentence, display: "in place", blankText: "#"})
            .cssContainer({"font-family": "monospace", "font-size": "40px"})
            .center()
            .print("center at 50vw", "middle at 40vh")
            .log()
            .wait()
            .remove()
        ,
        // Change the background color to blue as a production cue
        newFunction("BlueBackground", ()=>$("body").css("background-color", "rgba(173, 216, 230, 0.5)") ).call()
        ,
        getVar("RecordModeTrue")
            .test.is(1)
            .failure(
                newText("ContinueTextNoRecord", "Press Enter to continue.")
                    // .cssContainer({"font-size": "30px", "line-height": "270%"})
                    .cssContainer({"font-size": "30px"})
                    .print("center at 50vw", "middle at 40vh")
                    .center()
                    .italic()
                ,
                newKey("ContinueKeyNoRecord", "Enter")
                    .wait()
                    .log()
            )
            .success(
                newMediaRecorder(filename, "audio")
                    .record()
                ,
                newVar("ProductionTime").global().set( v => Date.now() )  // start timer
                ,
                // newTimer("minRecordTimer", 1000).start().wait()  // prevents participants from just clicking through
                // ,
                newKey("StopRecordingKey", "Enter")
                    .log()
                    // .wait()
                    .callback(
                        getTimer("ProductionTimeoutTimer").stop()
                    )
                ,
                newTimer("ProductionTimeoutTimer", 4000)  // production timer: 4
                    .start()
                    .wait()
                ,
                getVar("ProductionTime").set(v => Date.now() - v) // Calculate the elapsed time
                ,
                getKey("StopRecordingKey")
                    .test.pressed()  // test if the key was pressed at all (not true if timer elapsed first)
                        .failure(
                            // newText("ProductionTimeoutMessage", "<b>Reminder:</b><br><br>Finish the sentence and press <b>ENTER</b> to proceed.")
                            //     .cssContainer({"color": "red", "font-weight": "bold"})
                            //     .print()
                            // ,
                            // newVar("ProductionTime2").global().set( v => Date.now() )  // start timer
                            // ,
                            // Start another timer to limit the maximum time allowed for the second production attempt
                            // newKey("StopRecordingKey2", "")
                            //     .log()
                            //     .callback(
                            //         getTimer("ProductionTimeoutTimer2").stop()
                            //     )
                            // ,
                            // newTimer("ProductionTimeoutTimer2", 10000)
                            //     .start()
                            //     .wait()
                            // ,
                            // getVar("ProductionTime2").set(v => Date.now() - v)
                            // ,
                            // getVar("ProductionTime").set(v => v + getVar("ProductionTime2").value) // Add the additional production time
                            // ,
                            // getKey("StopRecordingKey2")
                            //     .test.pressed()
                            //         .failure( getVar("ProductionTimeoutVar").set(v => "TimedOut" ) )
                            getVar("ProductionTimeoutVar").set(v => "TimedOut" )
                        )
                ,
                // getText("ProductionTimeoutMessage").remove()
                // ,
                // Append 1sec to each recording to capture cut-off ends
                newTimer("RecordingSpilloverTimer", 1000)
                    .start()
                    .callback(
                        getMediaRecorder(filename)
                            .stop()
                    )
                ,
                // In debug mode only: print production time and add an extra Enter key
                getVar("DebugModeTrue")
                    .test.is(1)
                    .success(
                        // Reset background color
                        newFunction("ResetBackgroundWhiteDebug", ()=>$("body").css("background-color", "white") ).call()
                        ,
                        newText("Production time (displayed in debug mode only, in ms):")
                            .print()
                        ,
                        newText("ProdTimeText").text(getVar("ProductionTime"))
                            .print()
                    )
            )
        ,
        // Reset the background color at the end of the trial
        newFunction("ResetBackgroundWhite", ()=>$("body").css("background-color", "white") ).call()
        ,
        getVar("ProductionTimeoutVar")
            .test.is("TimedOut")
                .success(
                  newText("ProductionTimeoutMessage", "<b>Too slow!</b><br>Remember to finish the sentence with about 1 to 2 words<br>when the screen turns blue and to press <b>ENTER</b> when done.")
                      .cssContainer({"color": "red", "font-size": "25px"})
                      .print()
                  ,
                  newTimer("DummyTimer", 1000)
                      .start()
                      .wait()
                )
        ,
        newText("ContinueText", "Press Enter to continue.")
            .cssContainer({"font-size": "30px"})
            .print("center at 50vw", "middle at 40vh")
            .center()
            .italic()
        ,
        newKey("ContinueKey", "Enter")
            .wait()
            .log()
    )
    // Basic trial information
    .log("LatinList", row.Group)
    .log("Block", "Production")
    .log("ExpItemNum", row.ItemNum)
    .log("ExpItemType", row.Type)
    .log("ExpCondition", row.ExpCondition)
    .log("TargetPosition", row.TargetPosition)
    .log("TargetWord", row.TargetWord)
    .log("TargetFreq", row.Lg10WF)
    .log("SentenceEnd", row.End)
    .log("TrialCounterGlobal", getVar("TrialCounterGlobal"))
    .log("TrialCounterBlock", getVar("TrialCounterProduction"))
    // Production trial information
    .log("TargetAnswer_RecordingFilename", getVar("FileName"))
    .log("QuestionText_ProductionTime", getVar("ProductionTime"))
    .log("CorrectAnswer_ProductionTimeout", getVar("ProductionTimeoutVar"))
    .log("RunningAccuracy", "NA")
)
