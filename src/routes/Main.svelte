<script>
    import { link } from 'svelte-spa-router'
    import { employees, UpdateEmployees } from '../stores'

    let emp_list = [] 
    
    const unsub = employees.subscribe(value => {
        emp_list = value
    })
    

    function deleteEmp(id) {
        emp_list = emp_list.filter(entry => entry.id !== Number(id))

        UpdateEmployees(emp_list)


        
    }
  
  console.log(emp_list);
</script>

<style>
	.wrapper {
		height: 100%;
		display: grid;
		place-content: center;
	}

    
</style>


<div class="wrapper">
	<div class="container">
    <h1 style="margin-bottom: 50px; margin-top: 100px" class="title mb-4">Welcome Administrator </h1>
        
        <a class="btn btn-primary" style="margin-left: 20px; margin-bottom: 20px" use:link={'/login'}>Login</a>
        <a class="btn btn-primary" style="margin-left: 20px; margin-bottom: 20px" use:link={'/register'}>Register</a>

        <a class="btn btn-primary" style="margin-left: 20px; margin-bottom: 20px" use:link={'/create'}>Create New Employee</a>

		<table class="table table-bordered">
			<thead>
			  <tr>
				<th scope="col">#</th>
				<th scope="col">First</th>
				<th scope="col">Last</th>
				<th scope="col">Email</th>
				<th scope="col">Rank</th>
				<th scope="col">Work Started</th>
				<th scope="col">Shift Hours</th>
				<th scope="col">Update</th>
				<th scope="col">Delete</th>
			  </tr>
			</thead>
		
			<tbody>
                {#if emp_list && emp_list.length > 0}
                    {#each emp_list as emp, i}
                        <tr>
                            <th scope="row">{emp.id}</th>
                            <td>{emp.first_name}</td>
                            <td>{emp.last_name}</td>
                            <td>{emp.email}</td>
                            <td>{emp.rank}</td>
                            <td>{emp.work_started}</td>
                            <td>{emp.shift_hours}</td>
                            <td>
                                <a use:link={`/update/${emp.id}`} class="btn btn-outline-primary">Update</a>
                            </td>
                            <td>
                            <button on:click="{deleteEmp(emp.id)}" class="btn btn-outline-danger">Delete</button>
                            </td>
                        </tr>
                    {/each}
                {/if}
			</tbody>
		  </table>
	</div>
</div>