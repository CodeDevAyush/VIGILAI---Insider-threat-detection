# app.py
# Streamlit dashboard for visualising insider threat detection results.

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

import streamlit as st
import pandas as pd
import plotly.express as px

from pipeline import run_pipeline

st.set_page_config(page_title="Insider Threat AI", page_icon="🛡️", layout="wide")

st.title("🛡️ Insider Threat Detection Dashboard")
st.markdown("Real-time analysis of employee activity logs using an AI-powered multi-agent pipeline.")

with st.sidebar:
    st.header("⚙️ Configuration")
    log_source = st.text_input("Log CSV path", value="data/logs.csv")
    model_path = st.text_input("Model path", value="models/isolation_forest.pkl")
    run_btn = st.button("▶  Run Pipeline", type="primary")

if run_btn:
    with st.spinner("Running pipeline…"):
        try:
            result = run_pipeline(log_source=log_source, model_path=model_path)
        except Exception as e:
            st.error(f"Pipeline error: {e}")
            st.stop()

    col1, col2, col3 = st.columns(3)
    col1.metric("Total Records", result["total"])
    col2.metric("Anomalies Detected", result["anomalies"])
    col3.metric("Confirmed Threats", result["confirmed"])

    df_verified: pd.DataFrame = result["verified_df"]

    st.subheader("📋 Verified Threats")
    st.dataframe(df_verified, use_container_width=True)

    if "hour" in df_verified.columns:
        fig = px.histogram(
            df_verified,
            x="hour",
            color="confirmed_threat",
            barmode="overlay",
            title="Threat Activity by Hour of Day",
            labels={"hour": "Hour", "confirmed_threat": "Confirmed Threat"},
        )
        st.plotly_chart(fig, use_container_width=True)

    if "anomaly_score" in df_verified.columns:
        fig2 = px.box(
            df_verified,
            y="anomaly_score",
            color="confirmed_threat",
            title="Anomaly Score Distribution",
        )
        st.plotly_chart(fig2, use_container_width=True)
else:
    st.info("Configure the paths in the sidebar, then click **▶ Run Pipeline** to begin.")
