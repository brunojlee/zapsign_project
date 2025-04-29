Para execução desse projeto, em um ambiente com python3, git e Docker funcionais, siga esses passos para rodar o projeto:

1_ Rode os seguintes comandos no terminal:

git clone https://github.com/brunojlee/zapsign_project.git
cd zapsign-project
docker-compose build
docker-compose up -d

docker-compose exec backend python3 manage.py makemigrations
docker-compose exec backend python3 manage.py migrate
docker-compose exec backend python3 manage.py seed_company

2_ Acesse http://localhost:4200/

3_ Para os testes do frontend, rode no terminal:

cd zapsign-project/frontend/zapsign-frontend
ng tests
