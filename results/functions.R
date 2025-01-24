### FUNCTIONS FOR THE ANALYSIS OF THE CLOZE PREDICTION-PRODUCTION EXPERIMENT
### Miriam Schulz
### 22 January 2025


# Libraries
library(tidyverse)
library(Rmisc)
library(ggplot2)


# Read in PC Ibex data
read.pcibex <- function(filepath, auto.colnames=TRUE, fun.col=function(col,cols){cols[cols==col]<-paste(col,"Ibex",sep=".");return(cols)}) {
  n.cols <- max(count.fields(filepath,sep=",",quote=NULL),na.rm=TRUE)
  if (auto.colnames){
    cols <- c()
    con <- file(filepath, "r")
    while ( TRUE ) {
      line <- readLines(con, n = 1, warn=FALSE)
      if ( length(line) == 0) {
        break
      }
      m <- regmatches(line,regexec("^# (\\d+)\\. (.+)\\.$",line))[[1]]
      if (length(m) == 3) {
        index <- as.numeric(m[2])
        value <- m[3]
        if (is.function(fun.col)){
          cols <- fun.col(value,cols)
        }
        cols[index] <- value
        if (index == n.cols){
          break
        }
      }
    }
    close(con)
    return(read.csv(filepath, comment.char="#", header=FALSE, col.names=cols))
  }
  else{
    return(read.csv(filepath, comment.char="#", header=FALSE, col.names=seq(1:n.cols)))
  }
}

# Convert completion time from minutes to the format 00h00m00s
convert_to_hours <- function(minutes) {
  #if (is.na(minutes)) {return(NA)}
  minutes <- round(minutes)
  hours <- minutes %/% 60 %/% 60
  remaining_minutes <- (minutes %/% 60) - hours*60
  seconds <- minutes %% 60
  formatted_time <- sprintf("%dh%02dm%02d", hours, remaining_minutes, seconds)
  return(formatted_time)
}


# Preprocess the data to the target regions etc.
preprocess_data <- function(df) {
  
  # Annotate the region 
  df$Region <- "other"
  df <- df %>%
    mutate(Region = case_when(
      WordPosition == "5" ~ "pre-critical",
      WordPosition == "6" ~ "target",
      WordPosition == "7" ~ "spill1",
      WordPosition == "8" ~ "spill2"
    ))
  df$Region <- factor(df$Region, levels=c("pre-critical", "target",
                                          "spill1", "spill2"))
  
  # Transform variables
  df$RT <- as.numeric(df$RT)
  df$ExpCondition <- as.factor(df$ExpCondition)
  
  # Assign unique subject numbers from 1 to N
  df <- df %>%
    mutate(Subject = match(UniqueID, unique(UniqueID)))
  df$Subject <- as.factor(df$Subject)
  df$Item <- as.factor(df$ExpItemNum)
  
  # Add precritical RTs as new column (by Subject/Item)
  df_precrit <- df %>%
    dplyr::filter(Region == "pre-critical") %>%
    dplyr::select(Item, Subject, PreCriticalRT = RT)
  df <- df %>%
    left_join(df_precrit, by = c("Item", "Subject"))
  
  # Add a binary predictor to distinguish first vs. second half
  df$Half <- ifelse(df$Block %in% 1:2, "First Half", "Second Half")
  
  return(df)
}

# Calculate and print RTs by condition, task etc.
print_RTs <- function(df) {
  df <- df %>% 
    dplyr::filter(Region != "pre-critical" & Region != "other")
  cat("Overall mean RT:")
  print(round(mean(df$RT), 2))
  cat("Mean RT by condition:")
  df %>%
    dplyr::group_by(ExpCondition) %>%
    dplyr::summarise(mean_RT = mean(RT, na.rm = TRUE)) %>%
    print() 
  cat("Mean RT by condition & task:")
  df %>%
    dplyr::group_by(Task, ExpCondition) %>%
    dplyr::summarise(mean_RT = mean(RT, na.rm = TRUE)) %>%
    print()
  cat("Mean RT by condition & task & region:")
  df %>%
    dplyr::group_by(Region, Task, ExpCondition) %>%
    dplyr::summarise(mean_RT = mean(RT, na.rm = TRUE)) %>%
    print()
}

# Remove outliers with hard thresholds
remove_outliers_thresholds <- function(df, min_rt = 80, max_rt = 2500) {
  nrow_orig <- nrow(df)
  df <- filter(df,
               RT > min_rt & RT < max_rt)
  nrow_new <- nrow(df)
  nrow_diff <- nrow_orig-nrow_new
  cat("Number of data points eliminated:", nrow_diff, "out of", nrow_orig)
  cat("  (", round(nrow_diff / nrow_orig * 100, 2), "%)", sep="")
  return(df)
}

# Remove outliers using the by-subject standard deviation
remove_outliers_subj_sd <- function(df, sd_threshold=3) {
  nrow_orig <- nrow(df)
  df_subj_sd <- df %>% 
    summarySE(measurevar="RT",
              groupvars=c("UniqueID"),
              na.rm=T) %>% 
    select(UniqueID, RT, sd) %>% 
    dplyr::rename(MeanRT = RT)
  df <- merge(df, df_subj_sd, by="UniqueID")
  df <- df %>% 
    filter(RT < MeanRT+sd_threshold*sd & RT > MeanRT-sd_threshold*sd)
  df$sd <- NULL
  df$MeanRT <- NULL
  nrow_new <- nrow(df)
  nrow_diff <- nrow_orig-nrow_new
  cat("Number of data points eliminated:", nrow_diff, "out of", nrow_orig)
  cat("  (", round(nrow_diff / nrow_orig * 100, 2), "%)", sep="")
  return(df)
}

# Function to plot the RTs as histogram, colored by Subject
rt_hist <- function(dat, plot_subtitle) {
  ggplot(data=dat,
         aes(RT, fill=UniqueID)) + 
    geom_histogram(alpha = 0.5,
                   binwidth = 50,
                   show.legend=TRUE) + 
    labs(title = "RTs by Subject",
         subtitle = plot_subtitle,
         fill = "Subject") +
    theme_minimal() +
    theme(
      axis.title.x = element_text(size = 14, face = 'bold'),
      axis.title.y = element_text(size = 14, face = 'bold'),
      axis.text.x = element_text(size = 12, face = 'bold'),
      axis.text.y = element_text(size = 12),
      plot.title = element_text(size = 25, face = 'bold', hjust = 0.5),
      plot.subtitle = element_text(size = 16, face = "italic", hjust = 0.5),
      strip.text = element_text(size = 18, face = "bold")
    ) 
}

# Remove subjects with too fast RTs in one task using the mean by-subject RT
remove_fast_subjects <- function(df, threshold=200) {
  nrow_orig <- nrow(df)
  df_subj_mean <- df %>% 
    filter(RT < 2500) %>%   # to remove very large outliers
    summarySE(measurevar="RT",
              groupvars=c("UniqueID", "Task"),
              na.rm=T) %>% 
    select(UniqueID, Task, RT, sd) %>% 
    dplyr::rename(MeanRT = RT)
  df_subj_fast <- df_subj_mean %>% 
    filter(MeanRT < threshold)
  print("Fast subjects to eliminate:")
  (fast_subjects <- df_subj_fast$UniqueID)
  df_subj_mean %>%
    filter(UniqueID %in% fast_subjects) %>% 
    print()
  df <- df %>%
    filter(!(UniqueID %in% fast_subjects))
  nrow_new <- nrow(df)
  nrow_diff <- nrow_orig-nrow_new
  cat("Number of subjects eliminated:", length(fast_subjects), end="\n")
  cat("Number of data points eliminated:", nrow_diff, "out of", nrow_orig)
  cat("  (", round(nrow_diff / nrow_orig * 100, 2), "%)", sep="", end="\n")
  return(df)
}

# Remove subjects with invariant RTs between production and comprehension
remove_invavriant_subjects <- function(df, leniency = 10) {
  nrow_orig <- nrow(df)
  
  # Get mean RT by Task and Subject
  df_rt_by_task <- df %>%
    dplyr::group_by(UniqueID, Task) %>%
    dplyr::summarize(mean_RT = mean(RT, na.rm = TRUE), .groups = "drop")
  
  # Identify subjects whose RT in production > RT in comprehension
  varying_subjects <- df_rt_by_task %>%
    pivot_wider(names_from = Task, values_from = mean_RT) %>% # 
    # dplyr::filter(Production > Comprehension + leniency |
    #                 Comprehension > Production + leniency) %>%
    dplyr::filter(Production > Comprehension + leniency) %>% 
    pull(UniqueID)
  
  # Divide the data into participants with varying vs. invariant task RTs
  
  # a. varying
  df_varying_subjects <- df %>%
    filter(UniqueID %in% varying_subjects)
  varying <- unique(df_varying_subjects$UniqueID)
  print(length(varying))
  
  # b. invariant
  df_invariant_subjects <- df %>% 
    dplyr::filter(!(UniqueID %in% df_varying_subjects$UniqueID))
  invariant <- unique(df_invariant_subjects$UniqueID)
  print(length(invariant))
  
  nrow_new <- nrow(df_varying_subjects)
  nrow_diff <- nrow_orig-nrow_new
  
  cat("Number of invariant subjects eliminated:", length(invariant), end="\n")
  cat("Number of data points eliminated:", nrow_diff, "out of", nrow_orig)
  cat("  (", round(nrow_diff / nrow_orig * 100, 2), "%)", sep="", end="\n\n")
  
  # Print mean RT by Task and Subject in the invariant group
  cat("RTs of the invariant subjects:", end = "\n")
  df_invariant_subjects %>%
    dplyr::group_by(UniqueID, Task) %>%
    dplyr::summarize(mean_RT = mean(RT, na.rm = TRUE), .groups = "drop") %>% 
    print()
  
  return(df_varying_subjects)
}
