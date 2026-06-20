import { GoogleGenAI } from "@google/genai";
import { DayQuiz, getCourseForDay, getTopicTitleForDay, MCQQuestion, CodingQuestion } from "./types.js";
import { PRESET_DAILY_QUIZZES } from "./curriculumData.js";

// Lazy-initialize Gemini API client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
    try {
      aiClient = new GoogleGenAI({ apiKey });
      return aiClient;
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI client:", e);
    }
  }
  return null;
}

// Fallback questions dictionary for all 8 subjects to guarantee perfect operation-mode
const SUBJECT_FALLBACKS: Record<string, { mcqs: MCQQuestion[]; coding: CodingQuestion[] }> = {
  python: {
    mcqs: [
      {
        questionText: "What is the output of the code: print(type([1, 2] * 2)) in Python?",
        options: [
          "<class 'list'>",
          "<class 'tuple'>",
          "<class 'int'>",
          "TypeError: unsupported operand"
        ],
        correctOption: 0,
        explanation: "Multiplying a list by an integer duplicates the elements in a nested or flat list, but the resulting object type remains a list."
      },
      {
        questionText: "Which keyword is used to handle exceptions caught during run-time execution in Python?",
        options: ["catch", "try", "except", "throws"],
        correctOption: 2,
        explanation: "Python uses 'except' block to catch and handle exceptions, unlike Java/JS which use 'catch'."
      },
      {
        questionText: "What is the difference between list.append(x) and list.extend(x) in Python?",
        options: [
          "append adds x as a single element, extend adds elements of collection x individually",
          "extend adds x as a single element, append adds elements of x individually",
          "There is no difference, both are aliases",
          "append works in-place, extend returns a new list"
        ],
        correctOption: 0,
        explanation: "append() adds its argument as a single element to the end of a list. extend() iterates over its argument adding each element to the list."
      },
      {
        questionText: "Which of the following creates a dictionary with keys 'a' and 'b' initialized to 0?",
        options: [
          "dict.fromkeys(['a', 'b'], 0)",
          "{'a', 'b'}.fromkeys(0)",
          "dict({'a': 0, 'b'})",
          "dict.zip(['a', 'b'], [0])"
        ],
        correctOption: 0,
        explanation: "The classmethod dict.fromkeys(iterable, value) returns a new dictionary with keys from iterable and values set to value."
      },
      {
        questionText: "What does the '__init__' method represent in Python classes?",
        options: [
          "A destroyer function",
          "A static initializer",
          "The class constructor method called upon object creation",
          "An inheritance declaration tag"
        ],
        correctOption: 2,
        explanation: "The __init__ method is the constructor for a class. It is automatically called when a new instance is created."
      },
      {
        questionText: "How do you check if a key 'score' exists in a dictionary variables 'student_data'?",
        options: [
          "student_data.has_key('score')",
          "'score' in student_data",
          "student_data.contains('score')",
          "student_data.find('score')"
        ],
        correctOption: 1,
        explanation: "The modern Pythonic way to test dictionary key presence is the 'in' operator, e.g. 'key' in dict."
      },
      {
        questionText: "What is the output of the statement: len({1, 1, 2, 3, 3})?",
        options: ["5", "3", "2", "4"],
        correctOption: 1,
        explanation: "{1, 1, 2, 3, 3} creates a Set. Since Sets contain only unique elements, it results in {1, 2, 3}, which has a size/length of 3."
      },
      {
        questionText: "What type of scope resolution does Python follow?",
        options: [
          "Dynamic scope binding",
          "LEGB (Local, Enclosing, Global, Built-in)",
          "Global-first lookup",
          "Strict lexical block scope"
        ],
        correctOption: 1,
        explanation: "Python resolves variable lookups using the LEGB rule: Local, Enclosing function locals, Global (module-level), and Built-in names."
      }
    ],
    coding: [
      {
        questionText: "Write a function 'find_primes(n)' that takes an integer n and returns a list of prime numbers up to n.",
        starterCode: "def find_primes(n):\n    # Write your Python code below\n    primes = []\n    return primes",
        expectedKeywords: ["def", "range", "append", "return"],
        solutionDescription: "Iterate from 2 up to n. For each number, check if it has any divisor between 2 and its square root. If none exist, append it to the primes array."
      },
      {
        questionText: "Write a function 'word_frequencies(sentence)' that takes a sentence string and returns a dictionary counting occurrences of each unique word (case-insensitive).",
        starterCode: "def word_frequencies(sentence):\n    # Write your Python code below\n    freq = {}\n    return freq",
        expectedKeywords: ["def", "split", "lower", "return"],
        solutionDescription: "Split the sentence using lower() to get all words in lowercase, and then iterate to build or update a dictionary counter."
      }
    ]
  },
  numpy: {
    mcqs: [
      {
        questionText: "Which of the following is the standard way to import the NumPy library?",
        options: [
          "import numpy as np",
          "import num_py as np",
          "from numpy import *",
          "import np from numpy"
        ],
        correctOption: 0,
        explanation: "import numpy as np is the standard canonical convention followed in data science."
      },
      {
        questionText: "How do you create an array filled with zeros of shape (3, 4) in NumPy?",
        options: [
          "np.zeros(3, 4)",
          "np.zeros((3, 4))",
          "np.make_array(3, 4, fill=0)",
          "np.empty_zeros(3, 4)"
        ],
        correctOption: 1,
        explanation: "The shape parameter to np.zeros() must be given as an integer or tuple of integers, i.e., (3, 4)."
      },
      {
        questionText: "What is broadcasting in NumPy?",
        options: [
          "Transmitting arrays across network buffers",
          "NumPy's ability to perform arithmetic operations on arrays of different matching shapes",
          "Reshaping arrays by flattening them",
          "Printing multi-dimensional matrices to standard output"
        ],
        correctOption: 1,
        explanation: "Broadcasting is how NumPy treats arrays with different shapes during arithmetic operations, stretching the smaller array to match the larger."
      },
      {
        questionText: "How do you calculate the dot product of two NumPy arrays 'A' and 'B'?",
        options: ["A * B", "np.dot(A, B) or A @ B", "A.dot_product(B)", "np.multiply_dot(A, B)"],
        correctOption: 1,
        explanation: "A * B does element-wise multiplication. For matrix dot products, use np.dot(A, B), A.dot(B), or the modern py @ operator."
      },
      {
        questionText: "Which attribute tells you the number of dimensions of a NumPy array?",
        options: ["arr.ndim", "arr.shape", "arr.size", "arr.dim_count"],
        correctOption: 0,
        explanation: "arr.ndim stores the number of dimensions (axes) of an array as an integer."
      },
      {
        questionText: "What happens when you slice a NumPy array (e.g., sub = arr[0:2]) and modify an element in 'sub'?",
        options: [
          "Only 'sub' is changed, NumPy makes copy by default",
          "The original 'arr' is also updated because slices are views of the same memory allocation",
          "It raises a ReadOnlyMemoryException",
          "It creates an independent list copy"
        ],
        correctOption: 1,
        explanation: "To keep memory overhead low, NumPy slices return a 'view' of the parent array rather than a copy. Modifications alter the original."
      },
      {
        questionText: "How do you reshape an array of 12 elements into a matrix of 3 rows and 4 columns?",
        options: ["arr.reshape(3, 4)", "arr.set_shape(3, 4)", "np.change_shape(arr, (3, 4))", "arr.resize_matrix(4, 3)"],
        correctOption: 0,
        explanation: "arr.reshape(3, 4) or arr.reshape((3, 4)) changes the dimensions of the array without copying data."
      },
      {
        questionText: "What is the NumPy method to get the index of the maximum value inside a 1D array?",
        options: ["arr.imax()", "np.argmax(arr)", "arr.max_index()", "np.max_idx(arr)"],
        correctOption: 1,
        explanation: "argmax returns the index of the maximum value along a specified axis. For a 1D array, np.argmax(arr) works."
      }
    ],
    coding: [
      {
        questionText: "Write a NumPy function 'normalize_array(arr)' that takes a 1D numpy array, subtracts its mean, and divides by its standard deviation.",
        starterCode: "import numpy as np\n\ndef normalize_array(arr):\n    # Write your NumPy code below\n    return arr",
        expectedKeywords: ["mean", "std", "np"],
        solutionDescription: "Compute mean using arr.mean() or np.mean(arr), compute standard deviation using arr.std(), and then return (arr - mean) / std."
      },
      {
        questionText: "Write a function 'filter_matrix(matrix, threshold)' that returns all elements in a 2D matrix that are strictly greater than 'threshold' as a 1D array.",
        starterCode: "import numpy as np\n\ndef filter_matrix(matrix, threshold):\n    # Write your NumPy code below\n    return matrix",
        expectedKeywords: ["matrix", "threshold", "np"],
        solutionDescription: "Create a boolean mask by doing matrix > threshold, and then index the matrix with the mask: matrix[matrix > threshold]."
      }
    ]
  },
  pandas: {
    mcqs: [
      {
        questionText: "Which method is used to preview the first 5 rows of a Pandas DataFrame?",
        options: ["df.first(5)", "df.top()", "df.head()", "df.show_rows(5)"],
        correctOption: 2,
        explanation: "df.head() displays the first 5 rows of a DataFrame by default."
      },
      {
        questionText: "What is the difference between df.loc and df.iloc in Pandas?",
        options: [
          "loc is label-based selection, whereas iloc is integer-index based selection",
          "iloc is label-based selection, whereas loc is integer-index based selection",
          "loc selects columns only, iloc selects rows only",
          "loc does not support slicing, iloc supports slicing"
        ],
        correctOption: 0,
        explanation: "loc searches by row/column index labels, whereas iloc extracts values by their raw integer order (0-indexed offset)."
      },
      {
        questionText: "How do you drop columns 'Age' and 'Salary' from a DataFrame 'df' in-place?",
        options: [
          "df.drop(['Age', 'Salary'], axis=1, inplace=True)",
          "df.remove_cols(['Age', 'Salary'])",
          "df.drop_columns(['Age', 'Salary'])",
          "df.delete_axis(['Age', 'Salary'], inplace=True)"
        ],
        correctOption: 0,
        explanation: "df.drop() with axis=1 (or columns=['Age', 'Salary']) and inplace=True deletes columns directly within the variable memory."
      },
      {
        questionText: "Which method is used to count non-null values for each column in a DataFrame?",
        options: ["df.count()", "df.isnull_count()", "df.info_non_null()", "df.size_clean()"],
        correctOption: 0,
        explanation: "df.count() returns the number of non-NA/null observations for each column/row."
      },
      {
        questionText: "How would you fill all NaN values in a column 'Score' with the median of that column?",
        options: [
          "df['Score'].fillna(df['Score'].median(), inplace=True)",
          "df['Score'].fill_nan(df['Score'].median())",
          "df.replace_nulls('Score', fill='median')",
          "np.fillna(df['Score'], strategy='median')"
        ],
        correctOption: 0,
        explanation: "The standard pandas way is using series.fillna(value, inplace=True) with the column's computed median()."
      },
      {
        questionText: "What does df.groupby('City')['Revenue'].mean() do in Pandas?",
        options: [
          "Groups data by City and returns the average Revenue for each unique city",
          "Groups data by Revenue and calculates the average city count",
          "Filters out rows matching the keyword City or Revenue",
          "Sorts the city DataFrame by overall Revenue"
        ],
        correctOption: 0,
        explanation: "It groups rows matching the unique values of 'City', isolates the 'Revenue' column, and then calculates the mean for each group."
      },
      {
        questionText: "How do you export/save a Pandas DataFrame into a CSV file without exporting the row indexes?",
        options: [
          "df.to_csv('out.csv', index=False)",
          "df.export_csv('out.csv', no_index=True)",
          "df.write_csv('out.csv', include_idx=False)",
          "df.save_to_file('out.csv', index=None)"
        ],
        correctOption: 0,
        explanation: "Passing index=False to df.to_csv() prevents pandas from printing the index counter as the first column of the CSV sheet."
      },
      {
        questionText: "Which Pandas function is used to concatenate multiple DataFrames along rows or columns?",
        options: ["pd.concat()", "pd.merge()", "df.append_all()", "pd.join_frames()"],
        correctOption: 0,
        explanation: "pd.concat([df1, df2], axis=0/1) binds multiple DataFrames along rows (axis=0) or columns (axis=1)."
      }
    ],
    coding: [
      {
        questionText: "Write a Pandas function 'filter_active_adults(df)' that accepts a DataFrame with columns 'Age' and 'Status', and filters it returning rows where 'Age' is 18 or above AND 'Status' is equal to 'Active'.",
        starterCode: "import pandas as pd\n\ndef filter_active_adults(df):\n    # Write your Pandas code below\n    return df",
        expectedKeywords: ["df", "Age", "Status", "Active"],
        solutionDescription: "Apply boolean indexing: df[(df['Age'] >= 18) & (df['Status'] == 'Active')]. Parentheses are required around each separate conditional branch in Pandas."
      },
      {
        questionText: "Write a function 'compute_average_salary(df)' that groups a DataFrame with columns 'Department' and 'Salary' by 'Department', computes the average 'Salary', and returns the resulting Series.",
        starterCode: "import pandas as pd\n\ndef compute_average_salary(df):\n    # Write your Pandas code below\n    return None",
        expectedKeywords: ["groupby", "Department", "Salary", "mean"],
        solutionDescription: "Group the dataset of employees by 'Department', select 'Salary', and call .mean(): df.groupby('Department')['Salary'].mean()"
      }
    ]
  },
  ml: {
    mcqs: [
      {
        questionText: "Which package provides standard ready-to-use supervised learning models in python?",
        options: ["scikit-learn", "tensorflow", "pytorch", "statsmodels"],
        correctOption: 0,
        explanation: "scikit-learn is the standard library for traditional ML in python."
      },
      {
        questionText: "What represents the 'target variable' inside supervised learning equations?",
        options: ["X", "y", "weights", "intercept"],
        correctOption: 1,
        explanation: "y commonly denotes vectors of correct targets, while matrix X denotes the features."
      },
      {
        questionText: "What is the primary indicator of overfitting in machine learning?",
        options: ["High training error, low test error", "High training error, high test error", "Low training error, high test error", "Zero training time"],
        correctOption: 2,
        explanation: "Overfitting occurs when a model fits noisy features of the training set well (low training error), but cannot generalize to test datasets (high test error)."
      },
      {
        questionText: "What is the purpose of Cross Validation in model selection?",
        options: [
          "To test models on other servers",
          "To secure model binaries",
          "To evaluate model generalizability by training and testing on multiple partitions of the dataset",
          "To shuffle features horizontally"
        ],
        correctOption: 2,
        explanation: "Cross-validation divides the dataset into multiple k-folds to train/validate the model repeatedly, avoiding variance bias."
      },
      {
        questionText: "In a classification task, what is the 'confusion matrix' used for?",
        options: [
          "To encrypt predictions",
          "To see counts of True Positives, True Negatives, False Positives, and False Negatives",
          "To calculate matrix gradients",
          "To clean string inputs"
        ],
        correctOption: 1,
        explanation: "A confusion matrix shows classification performance metrics: true/false positives and negatives."
      },
      {
        questionText: "What is K-means clustering strictly used for?",
        options: [
          "Supervised classification of labels",
          "Unsupervised clustering of similar unlabeled observations",
          "Predicting continuous numerical trends",
          "Preprocessing image pixels"
        ],
        correctOption: 1,
        explanation: "K-Means is an unsupervised learning model that groups data into K distinct clusters based on Euclidean distances without target annotations."
      },
      {
        questionText: "What does the 'Coefficient of Determination' (R-squared) represent in Regressions?",
        options: [
          "The accuracy score of classifiers",
          "The proportion of variance in the dependent target variable that is predictable from the independent variables",
          "The slope angle of the regress line",
          "The number of variables in regularizations"
        ],
        correctOption: 1,
        explanation: "R² measures regression goodness of fit, denoting the percentage of variance predictable by variables (up to 1.0)."
      },
      {
        questionText: "Which technique is commonly used to prevent overfitting in models by penalizing high weights coefficients?",
        options: ["Regularization (L1 Lasso / L2 Ridge)", "Boosting", "Random Oversampling", "StandardNormalization"],
        correctOption: 0,
        explanation: "L1 (Lasso) and L2 (Ridge) add penalty penalties to structural loss functions to prevent coefficients from growing too large."
      }
    ],
    coding: [
      {
        questionText: "Write a scikit-learn training snippet 'train_logistic_regression(X_train, y_train)' that initializes a LogisticRegression model, fits it with training data, and returns the fitted model object.",
        starterCode: "from sklearn.linear_model import LogisticRegression\n\ndef train_logistic_regression(X_train, y_train):\n    # Write your code below\n    model = None\n    return model",
        expectedKeywords: ["LogisticRegression", "fit", "return"],
        solutionDescription: "Instantiate: lr = LogisticRegression(). Fit: lr.fit(X_train, y_train). Finally, return lr."
      },
      {
        questionText: "Write a function 'split_and_scale(X, y)' that splits features and targets into train/test sets (80% train, 20% test, random_state=42), fits a StandardScaler on X_train, scales X_train and X_test, and returns (X_train_scaled, X_test_scaled, y_train, y_test).",
        starterCode: "from sklearn.model_selection import train_test_split\nfrom sklearn.preprocessing import StandardScaler\n\ndef split_and_scale(X, y):\n    # Write your code below\n    return None",
        expectedKeywords: ["train_test_split", "StandardScaler", "fit_transform", "transform"],
        solutionDescription: "Use train_test_split to divide X and y. Then create StandardScaler(), call fit_transform on train data, and transform on test data."
      }
    ]
  },
  dl: {
    mcqs: [
      {
        questionText: "What is an activation function used for in Neural Networks?",
        options: [
          "Encrypting weight vectors",
          "To introduce non-linearities, enabling the model to learn complex high-dimensional mappings",
          "Accelerating CPU threads",
          "Normalizing target standard deviations"
        ],
        correctOption: 1,
        explanation: "Without non-linear activation functions (like ReLU, Sigmoid), stacking layers would just approximate simple linear combinations."
      },
      {
        questionText: "Which optimizer utilizes adaptive learning rates for each parameter?",
        options: ["Vanilla SGD", "Adam", "StepDecay", "MomentumOnly"],
        correctOption: 1,
        explanation: "Adam (Adaptive Moment Estimation) computes adaptive learning rates for each weight parameter based on first and second moments of gradients."
      },
      {
        questionText: "In deep learning, what is a CNN (Convolutional Neural Network) primarily optimized for?",
        options: ["Tabular spreadsheets", "Grid-like topology structures (images/pixels)", "Audio streams exclusively", "Text corpus translations"],
        correctOption: 1,
        explanation: "CNNs use modular convolutional filters targeting local receptive fields, making them optimal for processing 2D image matrices."
      },
      {
        questionText: "What is backpropagation in training artificial neural networks?",
        options: [
          "Feeding target inputs backward on disk",
          "An algorithm that calculates helper gradients of loss functions with respect to network weights via chain rule",
          "Shrinking layers when accuracy decreases",
          "A server restart procedure"
        ],
        correctOption: 1,
        explanation: "Backprop uses the chain rule of calculus to compute loss gradients with respect to each weight, working backward from output layers."
      },
      {
        questionText: "What does the term 'vanishing gradient' refer to?",
        options: [
          "A database error",
          "Gradients shrinking exponentially toward zero in initial layers during backprop, locking weights from updating",
          "Optimizers converging instantly",
          "Data files disappearing on training hosts"
        ],
        correctOption: 1,
        explanation: "During deep propagation back through highly saturated functions (e.g. sigmoid), derivatives multiply down to nearly 0, locking base layer updates."
      },
      {
        questionText: "Which function is optimally used as the output activator for multi-class classification?",
        options: ["ReLU", "Sigmoid", "Softmax", "Tanh"],
        correctOption: 2,
        explanation: "Softmax outputs a normalized probability distribution representing class predictions that sum exactly to 1.0."
      },
      {
        questionText: "What does 'Dropout' do during neural network training iterations?",
        options: [
          "Deletes columns in database",
          "Randomly turns off a fraction of neuron units to prevent excessive co-dependencies and overfitting",
          "Stops training execution early",
          "Clears memory parameters"
        ],
        correctOption: 1,
        explanation: "Dropout is a regularization tool where nodes are dropped with probability p on updates, forcing the network to learn robust, decentralized patterns."
      },
      {
        questionText: "What is the key structural benefit of an LSTM (Long Short-Term Memory) cell over standard RNNs?",
        options: [
          "Faster graphics rendering",
          "The inclusion of gated memory channels (cell state) that allow capturing long-term dependencies without vanishing values",
          "It does not require weight variables",
          "It runs completely in linear time complexity"
        ],
        correctOption: 1,
        explanation: "LSTMs use gates (input, forget, output) to protect and maintain a linear cell state channel, avoiding gradient dissipation over long text sequences."
      }
    ],
    coding: [
      {
        questionText: "Write a TensorFlow/Keras snippet 'create_simple_mlp()' that returns a Sequential model with a Flatten input layer, a Dense layer of 64 neurons with 'relu' activation, and an output Dense layer of 10 neurons with 'softmax' activation.",
        starterCode: "import tensorflow as tf\n\ndef create_simple_mlp():\n    model = tf.keras.models.Sequential([\n        # Add layers here\n    ])\n    return model",
        expectedKeywords: ["Sequential", "Flatten", "Dense", "relu", "softmax"],
        solutionDescription: "Construct: tf.keras.models.Sequential([tf.keras.layers.Flatten(), tf.keras.layers.Dense(64, activation='relu'), tf.keras.layers.Dense(10, activation='softmax')])"
      },
      {
        questionText: "Write a PyTorch initialization snippet 'get_adam_optimizer(model_params, lr=0.001)' that returns an Adam optimizer initialized with parameter targets and target learning rate.",
        starterCode: "import torch\nimport torch.nn as nn\n\ndef get_adam_optimizer(model_params, lr=0.001):\n    # Write code below\n    optimizer = None\n    return optimizer",
        expectedKeywords: ["optim", "Adam", "lr", "return"],
        solutionDescription: "Import torch.optim and initialize: torch.optim.Adam(model_params, lr=lr) then return."
      }
    ]
  },
  nlp: {
    mcqs: [
      {
        questionText: "What does TF-IDF represent in textual vector extraction?",
        options: [
          "Term Frequency - Inverse Document Frequency",
          "Total Formatting - Input Data Feed",
          "Token Filter - Index Directory Finder",
          "Text Formatting - Information Density Filter"
        ],
        correctOption: 0,
        explanation: "TF-IDF scores a term's relevance based on local occurrence (TF) penalized by global dataset commonality (IDF)."
      },
      {
        questionText: "Which tokenization step reduces words like 'running' and 'runs' to their root word 'run' using grammatical checks?",
        options: ["Stop-word filtering", "Stemming", "Lemmatization", "Chunking"],
        correctOption: 2,
        explanation: "Lemmatization uses morphological and vocabulary analysis to return true dictionary bases (lemmata), while stemming crudely cuts suffixes."
      },
      {
        questionText: "What is a 'stop word' in NLP?",
        options: [
          "A broken syntax character",
          "Frequently occurring words like 'the', 'is', 'and' that can be filtered to emphasize content words",
          "A command that stops execution loops",
          "A token signifying sentence boundaries"
        ],
        correctOption: 1,
        explanation: "Stop words are high-frequency connector words carrying minimal unique topical information, which are often filtered."
      },
      {
        questionText: "What is Word2Vec in natural language processing?",
        options: [
          "An algorithm for counting occurrences of variables",
          "A shallow neural network architecture model that learns dense vector representations of tokens preserving semantic similarities",
          "A document compression package",
          "A text storage matrix mapping keys"
        ],
        correctOption: 1,
        explanation: "Word2Vec generates high-quality distributed vector word embeddings where similar words reside near each other in multi-dimensional space."
      },
      {
        questionText: "In modern sequence modeling, what design component solved the bottleneck of encoding long sequences with fixed-size matrices?",
        options: ["GRU units", "Convolution filters", "Attention Mechanisms", "Recurrent cell stacks"],
        correctOption: 2,
        explanation: "Attention mechanisms allow model representations to reference all input tokens in parallel rather than routing sequence histories through restricted vectors."
      },
      {
        questionText: "Which transformer-based model was open-sourced by Google and revolutionized bi-directional context understanding?",
        options: ["GPT-2", "BERT", "ResNet", "TF-IDF"],
        correctOption: 1,
        explanation: "BERT (Bidirectional Encoder Representations from Transformers) learns context representations from both directions of a text sequence simultaneously."
      },
      {
        questionText: "What is the process of identifying proper noun entities like 'Google' (Organization) or 'London' (Location) in sentences?",
        options: ["Part-of-Speech tagging", "Sentiment lexicon analysis", "Named Entity Recognition (NER)", "Co-reference resolution"],
        correctOption: 2,
        explanation: "NER extracts semantic instances like persons, dates, locations, and organizations into typed categories."
      },
      {
        questionText: "Which standard NLP library is built for industrial-strength production processing in Python?",
        options: ["NLTK", "SpaCy", "re", "scikit-learn"],
        correctOption: 1,
        explanation: "While NLTK is excellent for education and academic study, SpaCy is optimized and compiled for real-time production throughput."
      }
    ],
    coding: [
      {
        questionText: "Write a function 'tokenize_and_clean(text)' using pure Python that converts a string to lowercase, filters out characters that are not alphabetic or whitespace, and returns a list of individual word tokens.",
        starterCode: "def tokenize_and_clean(text):\n    # Write Python code below\n    tokens = []\n    return tokens",
        expectedKeywords: ["lower", "isalpha", "split"],
        solutionDescription: "Call text.lower(). Iteratively verify character statuses or use a regex to retain spaces and letters, splitting the clean result into substrings."
      },
      {
        questionText: "Write an NLP feature block using scikit-learn 'extract_tfidf(corpus)' that fits a TfidfVectorizer on a list of texts 'corpus' and returns the dense representation matrix of tfidf features.",
        starterCode: "from sklearn.feature_extraction.text import TfidfVectorizer\n\ndef extract_tfidf(corpus):\n    # Write code below\n    return None",
        expectedKeywords: ["TfidfVectorizer", "fit_transform", "return"],
        solutionDescription: "Instantiate vectorizer = TfidfVectorizer(), invoke fit_transform(corpus), and return the resulting matrix."
      }
    ]
  },
  genai: {
    mcqs: [
      {
        questionText: "What is the primary objective of PEFT (Parameter-Efficient Fine-Tuning) techniques like LoRA?",
        options: [
          "To speed up database uploads",
          "To fine-tune LLMs by updating only a fraction of parameters, reducing memory costs from gigabytes to megabytes",
          "To encrypt prompt histories on servers",
          "To translate code to english"
        ],
        correctOption: 1,
        explanation: "LoRA (Low-Rank Adaptation) freezes model weights and adds small trainable rank decomposition matrices, greatly reducing hardware fine-tune requirements."
      },
      {
        questionText: "What is RAG (Retrieval-Augmented Generation) in Generative AI?",
        options: [
          "A tool for scanning image classifications",
          "Retrieving context from external documents or a database and embedding it in the prompt to ground model outputs in factual data",
          "An audio synthesizer package",
          "A prompt backup server framework"
        ],
        correctOption: 1,
        explanation: "RAG searches domain knowledge vectors first, attaching matching reference records to the API payload so the LLM outputs anchored facts."
      },
      {
        questionText: "In vector search engines, why do we store text documents as token vector embeddings?",
        options: [
          "To compress raw texts on disk",
          "To execute lexical matching indices",
          "To compute rapid semantic similarities (e.g., Cosine similarity) representing concepts, not just literal strings",
          "To format characters as HTML"
        ],
        correctOption: 2,
        explanation: "Embeddings place semantic meaning in vector dimensions: cosine similarity isolates conceptual overlaps across different phrases."
      },
      {
        questionText: "What constitutes the core role of LangChain in model deployments?",
        options: [
          "To host model weights on decentralized blockchains",
          "A framework designed to compose LLM calls, chain prompts, vector stores, memory trackers, and file loaders together seamlessly",
          "To format JSON output variables",
          "To speed up pytorch CUDA kernels"
        ],
        correctOption: 1,
        explanation: "LangChain is a widely-used design framework providing utility abstractions to assemble custom modular compound components around LLMs."
      },
      {
        questionText: "What are 'system instructions' (or system prompts) used for in LLMs?",
        options: [
          "Restarting container servers",
          "Setting the baseline behavior, framing constraints, persona, and rules of engagement before user dialog begins",
          "Formatting diagnostic logs",
          "Generating HTML style code templates"
        ],
        correctOption: 1,
        explanation: "System instructions govern structural boundaries, output restrictions, and behavioral tone throughout model dialog sessions."
      },
      {
        questionText: "How does 'Few-Shot Prompting' help a model deliver better responses?",
        options: [
          "It restricts prompt sizing limits",
          "It provides the model explicit input-output demonstration examples within the prompt context before requesting the target answer",
          "It requests answers multiple times",
          "It uses faster deep-learning libraries"
        ],
        correctOption: 1,
        explanation: "Demonstration pairs frame expectation scopes, teaching models structural output patterns instantaneously without retraining parameters."
      },
      {
        questionText: "Which vectors database is standard, fully open-source, and commonly run in-memory for prototyping LangChain RAG architectures?",
        options: ["PostgresSQL", "ChromaDB", "MongoDB", "RedisCache"],
        correctOption: 1,
        explanation: "ChromaDB is a highly popular, lightweight vector store designed for easy local development embedding registries."
      },
      {
        questionText: "What represents a fundamental risk when models produce coherent but completely fabricated claims in response to queries?",
        options: ["Stochastic decay", "Hallucination", "Overfitting iterations", "API key expiration"],
        correctOption: 1,
        explanation: "Hallucination occurs when an LLM writes fluent, factual-sounding statements that are incorrect relative to reality, due to next-token predictions."
      }
    ],
    coding: [
      {
        questionText: "Write a Gemini SDK completion snippet 'create_chat_completion(client, system_instruction, query)' that instantiates content generation using 'gemini-2.5-flash', applying the instruction and user query.",
        starterCode: "from google import genai\n\ndef create_chat_completion(client, system_instruction, query):\n    # Write Python code below\n    response = None\n    return response",
        expectedKeywords: ["models", "generate_content", "gemini-2.5-flash"],
        solutionDescription: "Call client.models.generate_content(model='gemini-2.5-flash', contents=query, config={'system_instruction': system_instruction})"
      },
      {
        questionText: "Write a Python prompt formatting statement 'create_rag_prompt(docs, question)' that accepts a list of text strings 'docs' and a 'question' string, joins search documents with double newlines, and returns a formatted string containing both context and question.",
        starterCode: "def create_rag_prompt(docs, question):\n    # Write your python string formatter here\n    return ''",
        expectedKeywords: ["join", "docs", "question"],
        solutionDescription: "Join docs using join: combined_docs = '\\n\\n'.join(docs). Then use an f-string to combine context and query."
      }
    ]
  },
  eda: {
    mcqs: [
      {
        questionText: "Which command generates descriptive summary statistics on numerical DataFrame columns?",
        options: ["df.summary()", "df.describe()", "df.stats()", "df.info_numerical()"],
        correctOption: 1,
        explanation: "df.describe() computes count, mean, std, min, quartiles, and maximum values of your columns."
      },
      {
        questionText: "What plotting library serves as the underlying backbone for Seaborn?",
        options: ["ggplot2", "Matplotlib", "Plotly", "D3.js"],
        correctOption: 1,
        explanation: "Seaborn compiles high-level plots down to native Matplotlib axes objects."
      },
      {
        questionText: "In Matplotlib, what does plt.subplots(2, 3) create?",
        options: [
          "A single plot containing 6 lines",
          "A grid array layout of 2 rows and 3 columns of subplots",
          "2 independent figure files on disk",
          "A 3D coordinate system"
        ],
        correctOption: 1,
        explanation: "It instantiates a figure grid of 2 rows and 3 coordinate axis instances, returning (fig, axes)."
      },
      {
        questionText: "Which Seaborn visualization excels at displaying pairwise relationships across multiple continuous features?",
        options: ["sns.heatmap()", "sns.pairplot()", "sns.catplot()", "sns.join_scatter()"],
        correctOption: 1,
        explanation: "sns.pairplot() generates diagonal distribution charts paired against off-diagonal bivariate scatter charts for fast correlation tracking."
      },
      {
        questionText: "How do you render a correlation matrix heatmap in Seaborn with numerical values explicitly written in cells?",
        options: [
          "sns.heatmap(df.corr(), annot=True)",
          "sns.heatmap(df.corr(), write_nums=True)",
          "sns.plot_corr(df, annotation=True)",
          "sns.correlation_grid(df.corr(), cells='values')"
        ],
        correctOption: 0,
        explanation: "annot=True (annotate) instructs seaborn to embed cell averages or coefficients as text over each gradient rectangle."
      },
      {
        questionText: "What type of distribution feature is optimally analyzed using a Box Plot (sns.boxplot)?",
        options: ["Frequency of categories only", "Outliers, medians, dispersion, and quartile metrics", "3D linear regression correlations", "Time-series seasonal cycles"],
        correctOption: 1,
        explanation: "Box plots provide concise vertical summaries highlighting median lines, Q1/Q3 boundaries, whiskers extensions, and outlier points outside boundaries."
      },
      {
        questionText: "How can you modify the standard background themes in Seaborn to use elegant gridlines?",
        options: ["sns.set_theme(style='whitegrid')", "sns.enable_grids()", "sns.use_style('grid_lines')", "sns.change_layout('standard')"],
        correctOption: 0,
        explanation: "sns.set_theme(style='whitegrid') configures modern light colors and gray horizontal grid intervals."
      },
      {
        questionText: "Which command saves active Matplotlib figures into directory asset structures on compile runs?",
        options: ["plt.save_figure('plot.png')", "plt.savefig('plot.png')", "fig.export_to('plot.png')", "plt.write_image('plot.png')"],
        correctOption: 1,
        explanation: "plt.savefig('filename.ext') saves the rendering buffer onto storage paths at custom DPI settings."
      }
    ],
    coding: [
      {
        questionText: "Write an EDA snippet using matplotlib 'plot_histogram(df, column_name)' that creates a figure with size 8x5, plots a histogram of the specified column with 20 bins, sets the title as 'Distribution', and returns the active plt module.",
        starterCode: "import matplotlib.pyplot as plt\n\ndef plot_histogram(df, column_name):\n    # Write code below\n    return plt",
        expectedKeywords: ["figure", "hist", "bins", "title"],
        solutionDescription: "Call plt.figure(figsize=(8, 5)), render using plt.hist(df[column_name], bins=20), set title, and return plt."
      },
      {
        questionText: "Write a Seaborn plotting function 'render_scatterplot(df, x_col, y_col, hue_col)' that sets a 'whitegrid' style, renders a scatterplot of x vs y with hue color mapping, and returns the plot axes.",
        starterCode: "import seaborn as sns\nimport matplotlib.pyplot as plt\n\ndef render_scatterplot(df, x_col, y_col, hue_col):\n    # Write code below\n    return None",
        expectedKeywords: ["set_theme", "scatterplot", "x", "y", "hue"],
        solutionDescription: "Call sns.set_theme(style='whitegrid'), draw usingax = sns.scatterplot(data=df, x=x_col, y=y_col, hue=hue_col), and return ax."
      }
    ]
  }
};

export async function generateQuizForDay(dayNumber: number): Promise<DayQuiz> {
  const course = getCourseForDay(dayNumber);
  const topicTitle = getTopicTitleForDay(dayNumber);

  if (PRESET_DAILY_QUIZZES[dayNumber]) {
    const data = PRESET_DAILY_QUIZZES[dayNumber];
    return {
      dayNumber,
      courseSlug: course.slug,
      topicTitle: data.topicTitle,
      mcqs: data.mcqs,
      coding: data.coding
    };
  }

  const ai = getAi();

  if (!ai) {
    // Return high quality local template
    return {
      dayNumber,
      courseSlug: course.slug,
      topicTitle,
      mcqs: SUBJECT_FALLBACKS[course.slug]?.mcqs || SUBJECT_FALLBACKS.python.mcqs,
      coding: SUBJECT_FALLBACKS[course.slug]?.coding || SUBJECT_FALLBACKS.python.coding
    };
  }

  try {
    const prompt = `
Generate a high-quality Data Science Daily Test quiz in JSON format for Day ${dayNumber}.
Course stage: ${course.name}.
Topic Focus: "${topicTitle}".

Important Structure instructions:
Return a JSON object containing EXACTLY:
{
  "dayNumber": ${dayNumber},
  "courseSlug": "${course.slug}",
  "topicTitle": "${topicTitle}",
  "mcqs": [
    {
      "questionText": "A precise, technical question covering ${topicTitle}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 0, // 0-indexed integer of the correct answer
      "explanation": "Brief context explanation of why this answer is correct"
    } // ... provide EXACTLY 8 MCQs
  ],
  "coding": [
    {
      "questionText": "Detailed description of python coding challenge targeting ${topicTitle}",
      "starterCode": "def solution_fn(...):\\n    # Write Python code here",
      "expectedKeywords": ["keyword1", "keyword2"],
      "solutionDescription": "Brief explanation of how to construct the correct solution"
    } // ... provide EXACTLY 2 Coding challenges
  ]
}

Ensure your output is strictly valid JSON, containing no explanation text, and wrapped inside markdown code blocks.
`;

    console.log(`[Gemini API] Generating test for Day ${dayNumber} (${course.slug})...`);
    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const respText = resp.text || "";
    // Clean JSON code blocks
    let jsonString = respText.trim();
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.slice(7);
    } else if (jsonString.startsWith("```")) {
      jsonString = jsonString.slice(3);
    }
    if (jsonString.endsWith("```")) {
      jsonString = jsonString.slice(0, -3);
    }
    jsonString = jsonString.trim();

    try {
      const parsed = JSON.parse(jsonString) as DayQuiz;
      if (parsed && Array.isArray(parsed.mcqs) && parsed.mcqs.length === 8 && Array.isArray(parsed.coding) && parsed.coding.length === 2) {
        return parsed;
      }
      throw new Error("Parsed JSON has invalid structure or length of lists");
    } catch (parseErr) {
      console.warn("[Gemini API] JSON parsing or structure failure, falling back: ", parseErr, "Raw output was: ", respText);
    }
  } catch (err) {
    console.error("[Gemini API] Request error:", err);
  }

  // Fallback to beautiful static topic content
  return {
    dayNumber,
    courseSlug: course.slug,
    topicTitle,
    mcqs: SUBJECT_FALLBACKS[course.slug]?.mcqs || SUBJECT_FALLBACKS.python.mcqs,
    coding: SUBJECT_FALLBACKS[course.slug]?.coding || SUBJECT_FALLBACKS.python.coding
  };
}

export async function generateQuizFromMaterial(
  materialText: string,
  dayNumber: number,
  courseSlug: string,
  topicTitle: string
): Promise<DayQuiz> {
  const ai = getAi();
  if (!ai) {
    throw new Error("Gemini API Key is not configured. Please set GEMINI_API_KEY in the Secrets settings.");
  }

  const prompt = `
You are an expert Data Science and AI educator.
We have received the following uploaded/inserted course content material for Day ${dayNumber} (Subject Slug: "${courseSlug}", Topic: "${topicTitle}"):

--- BEGIN COURSE MATERIAL ---
${materialText}
--- END COURSE MATERIAL ---

Your task is to analyze this course material and generate a high-quality educational quiz in JSON format containing EXACTLY 10 questions in total:
- 8 Multiple Choice Questions (MCQs) covering key concepts, code interpretations, or calculations directly related to the material.
- 2 Python coding exercises directly testing application or custom manipulation of concepts covered in the material.

Return a JSON object containing EXACTLY this structure:
{
  "dayNumber": ${dayNumber},
  "courseSlug": "${courseSlug}",
  "topicTitle": "${topicTitle}",
  "mcqs": [
    {
      "questionText": "A precise, technical question directly based on the uploaded material...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 0, // 0-indexed integer of the correct answer (0, 1, 2, or 3)
      "explanation": "Brief context explanation of why this option is correct based on the material."
    } // ... provide EXACTLY 8 MCQs
  ],
  "coding": [
    {
      "questionText": "Detailed description of python coding challenge targeting concepts in the material...",
      "starterCode": "def solution_fn(...):\\n    # Write Python code here",
      "expectedKeywords": ["keyword1", "keyword2"],
      "solutionDescription": "Brief explanation of how to construct the correct solution"
    } // ... provide EXACTLY 2 Coding challenges
  ]
}

Ensure your output is strictly valid JSON, containing no conversational explanation text, and wrapped inside markdown code blocks.
`;

  console.log(`[Gemini API] Custom material quiz generating for Day ${dayNumber}...`);
  const resp = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
  });

  const respText = resp.text || "";
  let jsonString = respText.trim();
  if (jsonString.startsWith("```json")) {
    jsonString = jsonString.slice(7);
  } else if (jsonString.startsWith("```")) {
    jsonString = jsonString.slice(3);
  }
  if (jsonString.endsWith("```")) {
    jsonString = jsonString.slice(0, -3);
  }
  jsonString = jsonString.trim();

  try {
    const parsed = JSON.parse(jsonString) as DayQuiz;
    if (parsed && Array.isArray(parsed.mcqs) && parsed.mcqs.length === 8 && Array.isArray(parsed.coding) && parsed.coding.length === 2) {
      // Set values to match selected criteria
      parsed.dayNumber = dayNumber;
      parsed.courseSlug = courseSlug;
      parsed.topicTitle = topicTitle;
      return parsed;
    }
    throw new Error("Parsed JSON has invalid structure or length of lists");
  } catch (parseErr) {
    console.error("[Gemini API] JSON parsing or structure failure:", parseErr, "Raw output:", respText);
    throw new Error("Failed to parse Gemini generated quiz. Ensure the provided material is clean text/code and try again.");
  }
}

