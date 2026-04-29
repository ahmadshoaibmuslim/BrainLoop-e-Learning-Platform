import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .models import Course

def get_similar_courses(course_id, num_recommendations=4):
    """
    Get similar courses based on content (category, tags, description).
    Falls back to empty QuerySet if insufficient data.
    """
    try:
        # Get all published courses
        courses = Course.objects.filter(
            platform_status="Published",
            teacher_course_status="Published"
        )
        
        if not courses.exists():
            return Course.objects.none()
        
        course_list = list(courses.values('id', 'title', 'category', 'tags', 'description'))
        
        if len(course_list) < 2:
            return Course.objects.none()
        
        # Convert data into a pandas DataFrame
        df = pd.DataFrame(course_list)
        
        # Convert category ID to string and handle null values
        df['category'] = df['category'].astype(str)
        df['tags'] = df['tags'].fillna('')
        df['description'] = df['description'].fillna('')
        
        # Combine 'category', 'tags', and 'description' as course content
        df['content'] = df['category'] + " " + df['tags'] + " " + df['description']
        
        # Skip if all content is empty
        if df['content'].str.strip().eq('').all():
            return Course.objects.none()
        
        # TF-IDF Vectorization
        vectorizer = TfidfVectorizer(stop_words='english', max_features=100)
        tfidf_matrix = vectorizer.fit_transform(df['content'])
        
        # Compute cosine similarity between courses
        cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

        # Get index of the target course
        course_index = df[df['id'] == course_id].index
        
        if len(course_index) == 0:
            return Course.objects.none()
        
        course_index = course_index[0]
        
        # Get similarity scores for the target course
        sim_scores = list(enumerate(cosine_sim[course_index]))
        
        # Sort courses by similarity score
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        
        # Get the most similar courses (excluding itself)
        sim_scores = sim_scores[1:num_recommendations + 1]
        
        if len(sim_scores) == 0:
            return Course.objects.none()
        
        # Fetch course IDs
        similar_course_ids = [df.iloc[i[0]]['id'] for i in sim_scores]
        
        # Retrieve courses from the database
        similar_courses = Course.objects.filter(id__in=similar_course_ids)

        return similar_courses
        
    except Exception as e:
        print(f"Error in get_similar_courses: {e}")
        # Return empty QuerySet instead of crashing
        return Course.objects.none()
