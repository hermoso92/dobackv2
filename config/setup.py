from setuptools import setup, find_packages

setup(
    name="DobackSoft",
    version="2.0.0",
    packages=find_packages(),
    install_requires=[
        "pandas",
        "numpy",
        "sqlalchemy",
        "psycopg2-binary",
        "pytest",
        "pyyaml",
    ],
    python_requires=">=3.9",
) 