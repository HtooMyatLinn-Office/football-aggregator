/**
 * CI/CD pipeline — Football Data Aggregator API
 * Repository: https://github.com/HtooMyatLinn-Office/football-aggregator
 *
 * Target: Windows Jenkins agent (all steps use `bat`, not `sh`).
 *
 * Jenkins setup (recommended):
 *  - Agent label: windows (or set AGENT_LABEL parameter)
 *  - Node.js 20+ on agent PATH
 *  - Optional credential (Secret file): football-aggregator-env → full .env for deploy
 *  - Optional: PM2 on deploy host PATH when RUN_DEPLOY=true
 *
 * Detected from package.json:
 *  - npm ci, db:generate (Prisma), lint, typecheck, format:check, build (tsc)
 *
 * Detected from prisma/schema.prisma:
 *  - PostgreSQL datasource → migrate deploy (if migrations/) else db push on deploy
 */
pipeline {
    agent {
        label "${params.AGENT_LABEL ?: 'windows'}"
    }

    parameters {
        string(
            name: 'AGENT_LABEL',
            defaultValue: 'windows',
            description: 'Jenkins agent label (must be a Windows node with Node 20+)'
        )
        booleanParam(
            name: 'SKIP_QUALITY',
            defaultValue: false,
            description: 'Skip lint, typecheck, and format:check'
        )
        booleanParam(
            name: 'RUN_DEPLOY',
            defaultValue: false,
            description: 'Run PM2 deploy stage (requires DEPLOY_DIR and .env credential)'
        )
        string(
            name: 'DEPLOY_DIR',
            defaultValue: 'C:\\apps\\football-aggregator',
            description: 'Windows path on the agent where the app is deployed (PM2 stage)'
        )
        string(
            name: 'ENV_FILE_CREDENTIAL_ID',
            defaultValue: 'football-aggregator-env',
            description: 'Jenkins Secret file credential ID containing production .env (deploy only)'
        )
        booleanParam(
            name: 'RUN_DB_MIGRATE',
            defaultValue: false,
            description: 'Run prisma migrate deploy / db push against DATABASE_URL in .env'
        )
    }

    environment {
        // CI-safe defaults — Prisma generate + tsc do not connect to the DB
        NODE_ENV = 'test'
        CI = 'true'
        DATABASE_URL = 'postgresql://ci:ci@127.0.0.1:5432/football_ci?schema=public'
        NPM_CONFIG_FUND = 'false'
        NPM_CONFIG_AUDIT = 'false'
    }

    options {
        timestamps()
        timeout(time: 45, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '30', artifactNumToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify Prerequisites') {
            steps {
                bat '''
                    @echo off
                    echo === Verifying Node.js and npm ===
                    node --version
                    npm --version
                    where node
                    where npm
                '''
                bat '''
                    @echo off
                    node -e "const m=+process.versions.node.split('.')[0]; if(m<20){console.error('ERROR: Node.js 20+ required (package.json engines)'); process.exit(1)}"
                    if errorlevel 1 exit /b 1
                '''
            }
        }

        stage('Prepare Environment') {
            steps {
                script {
                    if (params.RUN_DEPLOY && params.ENV_FILE_CREDENTIAL_ID?.trim()) {
                        withCredentials([
                            file(credentialsId: params.ENV_FILE_CREDENTIAL_ID.trim(), variable: 'ENV_FILE')
                        ]) {
                            bat 'copy /Y "%ENV_FILE%" .env'
                        }
                        echo 'Production .env installed from Jenkins credential (deploy build).'
                    } else if (fileExists('.env')) {
                        echo 'Using existing workspace .env'
                    } else {
                        bat 'if not exist .env copy /Y .env.example .env'
                        echo 'CI: using .env.example copy (no secrets). Sufficient for build/lint/typecheck.'
                    }
                }
                bat 'if not exist storage\\images mkdir storage\\images'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat '''
                    @echo off
                    echo === npm ci (package-lock.json) ===
                    call npm ci
                    if errorlevel 1 exit /b 1
                '''
            }
        }

        stage('Prisma Generate') {
            steps {
                bat '''
                    @echo off
                    echo === Prisma client generate (schema: prisma/schema.prisma) ===
                    call npm run db:generate
                    if errorlevel 1 exit /b 1
                    if not exist node_modules\\.prisma\\client (
                        echo ERROR: Prisma client was not generated.
                        exit /b 1
                    )
                '''
            }
        }

        stage('Quality Checks') {
            when {
                expression { return !params.SKIP_QUALITY }
            }
            stages {
                stage('Lint') {
                    steps {
                        bat '''
                            @echo off
                            call npm run lint
                            if errorlevel 1 exit /b 1
                        '''
                    }
                }
                stage('Typecheck') {
                    steps {
                        bat '''
                            @echo off
                            call npm run typecheck
                            if errorlevel 1 exit /b 1
                        '''
                    }
                }
                stage('Format Check') {
                    steps {
                        bat '''
                            @echo off
                            call npm run format:check
                            if errorlevel 1 exit /b 1
                        '''
                    }
                }
            }
        }

        stage('Build TypeScript') {
            steps {
                bat '''
                    @echo off
                    echo === tsc build (output: dist/) ===
                    call npm run build
                    if errorlevel 1 exit /b 1
                    if not exist dist\\index.js (
                        echo ERROR: dist/index.js missing after build.
                        exit /b 1
                    )
                    if not exist dist\\workers\\index.js (
                        echo ERROR: dist/workers/index.js missing (required for PM2 worker).
                        exit /b 1
                    )
                '''
            }
        }

        stage('Package Release') {
            steps {
                bat '''
                    @echo off
                    if exist release rmdir /s /q release
                    mkdir release
                    mkdir release\\dist
                    mkdir release\\prisma
                    mkdir release\\storage\\images
                    xcopy /E /I /Y dist release\\dist
                    xcopy /E /I /Y prisma release\\prisma
                    copy /Y package.json release\\
                    copy /Y package-lock.json release\\
                    copy /Y ecosystem.config.cjs release\\
                    copy /Y .env.example release\\
                '''
                archiveArtifacts artifacts: 'release/**', fingerprint: true, onlyIfSuccessful: true
            }
        }

        stage('Deploy with PM2') {
            when {
                expression { return params.RUN_DEPLOY }
            }
            steps {
                script {
                    if (!params.ENV_FILE_CREDENTIAL_ID?.trim()) {
                        error 'RUN_DEPLOY requires ENV_FILE_CREDENTIAL_ID (Secret file with production .env).'
                    }
                }
                bat """
                    @echo off
                    set DEPLOY_DIR=${params.DEPLOY_DIR}
                    echo === Deploying to %DEPLOY_DIR% ===
                    if not exist \"%DEPLOY_DIR%\" mkdir \"%DEPLOY_DIR%\"
                    xcopy /E /I /Y release\\* \"%DEPLOY_DIR%\\\"
                """
                withCredentials([
                    file(credentialsId: params.ENV_FILE_CREDENTIAL_ID.trim(), variable: 'ENV_FILE')
                ]) {
                    bat """
                        @echo off
                        copy /Y \"%ENV_FILE%\" \"${params.DEPLOY_DIR}\\.env\"
                    """
                }
                bat """
                    @echo off
                    cd /d \"${params.DEPLOY_DIR}\"
                    call npm ci --omit=dev
                    if errorlevel 1 exit /b 1
                    call npm run db:generate
                    if errorlevel 1 exit /b 1
                """
                script {
                    if (params.RUN_DB_MIGRATE) {
                        if (fileExists('prisma/migrations')) {
                            bat """
                                @echo off
                                cd /d \"${params.DEPLOY_DIR}\"
                                call npx prisma migrate deploy
                                if errorlevel 1 exit /b 1
                            """
                        } else {
                            bat """
                                @echo off
                                cd /d \"${params.DEPLOY_DIR}\"
                                echo No prisma/migrations — running db push
                                call npx prisma db push --skip-generate
                                if errorlevel 1 exit /b 1
                            """
                        }
                    }
                }
                bat """
                    @echo off
                    cd /d \"${params.DEPLOY_DIR}\"
                    where pm2 >nul 2>&1
                    if errorlevel 1 (
                        echo ERROR: pm2 not found on PATH. Install: npm install -g pm2
                        exit /b 1
                    )
                    pm2 describe football-api >nul 2>&1
                    if errorlevel 1 (
                        echo Starting PM2 apps for the first time...
                        call pm2 start ecosystem.config.cjs --env production
                    ) else (
                        echo Reloading PM2 apps...
                        call pm2 reload ecosystem.config.cjs --env production
                    )
                    call pm2 save
                    call pm2 status
                """
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded. Artifacts: release/ (dist, prisma, package files, ecosystem.config.cjs)'
        }
        failure {
            echo 'Pipeline failed. Check console output for the first failing bat step.'
        }
        always {
            bat '''
                @echo off
                echo === Workspace summary ===
                if exist dist dir dist
            '''
        }
    }
}
