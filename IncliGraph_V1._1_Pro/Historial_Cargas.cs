using System;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.CompilerServices;
using System.Windows.Forms;
using IncliGraph_V1._1_Pro.DatosDataSetTableAdapters;
using IncliGraph_V1._1_Pro.My;
using Microsoft.VisualBasic.CompilerServices;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class Historial_Cargas : Form
{
	private IContainer components;

	[CompilerGenerated]
	[AccessedThroughProperty("ListBox1")]
	private ListBox _ListBox1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button1")]
	private Button _Button1;

	public DataRow[] Lista_cargas;

	internal virtual ListBox ListBox1
	{
		[CompilerGenerated]
		get
		{
			return _ListBox1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = ListBox1_SelectedIndexChanged;
			ListBox listBox = _ListBox1;
			if (listBox != null)
			{
				listBox.SelectedIndexChanged -= value2;
			}
			_ListBox1 = value;
			listBox = _ListBox1;
			if (listBox != null)
			{
				listBox.SelectedIndexChanged += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label1")]
	internal virtual Label Label1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("GroupBox1")]
	internal virtual GroupBox GroupBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox1")]
	internal virtual TextBox TextBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label3")]
	internal virtual Label Label3
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox6")]
	internal virtual TextBox TextBox6
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox5")]
	internal virtual TextBox TextBox5
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox3")]
	internal virtual TextBox TextBox3
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label7")]
	internal virtual Label Label7
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label5")]
	internal virtual Label Label5
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox4")]
	internal virtual TextBox TextBox4
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label6")]
	internal virtual Label Label6
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox2")]
	internal virtual TextBox TextBox2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label4")]
	internal virtual Label Label4
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label8")]
	internal virtual Label Label8
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual Button Button1
	{
		[CompilerGenerated]
		get
		{
			return _Button1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button1_Click;
			Button button = _Button1;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button1 = value;
			button = _Button1;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("DatosDataSet")]
	internal virtual DatosDataSet DatosDataSet
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("FechasBindingSource")]
	internal virtual BindingSource FechasBindingSource
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("FechasTableAdapter")]
	internal virtual FechasTableAdapter FechasTableAdapter
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TableAdapterManager")]
	internal virtual TableAdapterManager TableAdapterManager
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	public Historial_Cargas()
	{
		base.FormClosing += Historial_Cargas_FormClosing;
		base.Load += Historial_Cargas_Load;
		InitializeComponent();
	}

	[DebuggerNonUserCode]
	protected override void Dispose(bool disposing)
	{
		try
		{
			if (disposing && components != null)
			{
				components.Dispose();
			}
		}
		finally
		{
			base.Dispose(disposing);
		}
	}

	[System.Diagnostics.DebuggerStepThrough]
	private void InitializeComponent()
	{
		this.components = new System.ComponentModel.Container();
		this.ListBox1 = new System.Windows.Forms.ListBox();
		this.Label1 = new System.Windows.Forms.Label();
		this.GroupBox1 = new System.Windows.Forms.GroupBox();
		this.TextBox6 = new System.Windows.Forms.TextBox();
		this.TextBox5 = new System.Windows.Forms.TextBox();
		this.TextBox3 = new System.Windows.Forms.TextBox();
		this.Label7 = new System.Windows.Forms.Label();
		this.Label5 = new System.Windows.Forms.Label();
		this.TextBox4 = new System.Windows.Forms.TextBox();
		this.Label6 = new System.Windows.Forms.Label();
		this.TextBox2 = new System.Windows.Forms.TextBox();
		this.Label4 = new System.Windows.Forms.Label();
		this.TextBox1 = new System.Windows.Forms.TextBox();
		this.Label8 = new System.Windows.Forms.Label();
		this.Label3 = new System.Windows.Forms.Label();
		this.Button1 = new System.Windows.Forms.Button();
		this.DatosDataSet = new IncliGraph_V1._1_Pro.DatosDataSet();
		this.FechasBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.FechasTableAdapter = new IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.FechasTableAdapter();
		this.TableAdapterManager = new IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.TableAdapterManager();
		this.GroupBox1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.DatosDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.FechasBindingSource).BeginInit();
		base.SuspendLayout();
		this.ListBox1.FormattingEnabled = true;
		this.ListBox1.Location = new System.Drawing.Point(6, 19);
		this.ListBox1.Name = "ListBox1";
		this.ListBox1.Size = new System.Drawing.Size(150, 199);
		this.ListBox1.TabIndex = 0;
		this.Label1.AutoSize = true;
		this.Label1.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.Label1.Location = new System.Drawing.Point(6, 6);
		this.Label1.Name = "Label1";
		this.Label1.Size = new System.Drawing.Size(294, 16);
		this.Label1.TabIndex = 1;
		this.Label1.Text = "Cargas realizadas en el vehículo seleccionado: ";
		this.GroupBox1.Controls.Add(this.TextBox6);
		this.GroupBox1.Controls.Add(this.TextBox5);
		this.GroupBox1.Controls.Add(this.TextBox3);
		this.GroupBox1.Controls.Add(this.Label7);
		this.GroupBox1.Controls.Add(this.Label5);
		this.GroupBox1.Controls.Add(this.TextBox4);
		this.GroupBox1.Controls.Add(this.Label6);
		this.GroupBox1.Controls.Add(this.TextBox2);
		this.GroupBox1.Controls.Add(this.Label4);
		this.GroupBox1.Controls.Add(this.TextBox1);
		this.GroupBox1.Controls.Add(this.Label8);
		this.GroupBox1.Controls.Add(this.Label3);
		this.GroupBox1.Controls.Add(this.ListBox1);
		this.GroupBox1.Location = new System.Drawing.Point(9, 21);
		this.GroupBox1.Name = "GroupBox1";
		this.GroupBox1.Size = new System.Drawing.Size(576, 227);
		this.GroupBox1.TabIndex = 2;
		this.GroupBox1.TabStop = false;
		this.TextBox6.BackColor = System.Drawing.Color.White;
		this.TextBox6.Location = new System.Drawing.Point(279, 94);
		this.TextBox6.Multiline = true;
		this.TextBox6.Name = "TextBox6";
		this.TextBox6.ReadOnly = true;
		this.TextBox6.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
		this.TextBox6.Size = new System.Drawing.Size(289, 124);
		this.TextBox6.TabIndex = 3;
		this.TextBox5.BackColor = System.Drawing.Color.White;
		this.TextBox5.Location = new System.Drawing.Point(441, 68);
		this.TextBox5.Name = "TextBox5";
		this.TextBox5.ReadOnly = true;
		this.TextBox5.Size = new System.Drawing.Size(129, 20);
		this.TextBox5.TabIndex = 2;
		this.TextBox3.BackColor = System.Drawing.Color.White;
		this.TextBox3.Location = new System.Drawing.Point(279, 68);
		this.TextBox3.Name = "TextBox3";
		this.TextBox3.ReadOnly = true;
		this.TextBox3.Size = new System.Drawing.Size(66, 20);
		this.TextBox3.TabIndex = 2;
		this.Label7.AutoSize = true;
		this.Label7.Location = new System.Drawing.Point(354, 71);
		this.Label7.Name = "Label7";
		this.Label7.Size = new System.Drawing.Size(81, 13);
		this.Label7.TabIndex = 1;
		this.Label7.Text = "Configuración 2";
		this.Label5.AutoSize = true;
		this.Label5.Location = new System.Drawing.Point(197, 71);
		this.Label5.Name = "Label5";
		this.Label5.Size = new System.Drawing.Size(76, 13);
		this.Label5.TabIndex = 1;
		this.Label5.Text = "Hora de Carga";
		this.TextBox4.BackColor = System.Drawing.Color.White;
		this.TextBox4.Location = new System.Drawing.Point(441, 42);
		this.TextBox4.Name = "TextBox4";
		this.TextBox4.ReadOnly = true;
		this.TextBox4.Size = new System.Drawing.Size(129, 20);
		this.TextBox4.TabIndex = 2;
		this.Label6.AutoSize = true;
		this.Label6.Location = new System.Drawing.Point(354, 45);
		this.Label6.Name = "Label6";
		this.Label6.Size = new System.Drawing.Size(81, 13);
		this.Label6.TabIndex = 1;
		this.Label6.Text = "Configuración 1";
		this.TextBox2.BackColor = System.Drawing.Color.White;
		this.TextBox2.Location = new System.Drawing.Point(279, 42);
		this.TextBox2.Name = "TextBox2";
		this.TextBox2.ReadOnly = true;
		this.TextBox2.Size = new System.Drawing.Size(66, 20);
		this.TextBox2.TabIndex = 2;
		this.Label4.AutoSize = true;
		this.Label4.Location = new System.Drawing.Point(190, 45);
		this.Label4.Name = "Label4";
		this.Label4.Size = new System.Drawing.Size(83, 13);
		this.Label4.TabIndex = 1;
		this.Label4.Text = "Fecha de Carga";
		this.TextBox1.BackColor = System.Drawing.Color.White;
		this.TextBox1.Location = new System.Drawing.Point(279, 16);
		this.TextBox1.Name = "TextBox1";
		this.TextBox1.ReadOnly = true;
		this.TextBox1.Size = new System.Drawing.Size(66, 20);
		this.TextBox1.TabIndex = 2;
		this.Label8.AutoSize = true;
		this.Label8.Location = new System.Drawing.Point(181, 97);
		this.Label8.Name = "Label8";
		this.Label8.Size = new System.Drawing.Size(92, 13);
		this.Label8.TabIndex = 1;
		this.Label8.Text = "Registro de Carga";
		this.Label3.AutoSize = true;
		this.Label3.Location = new System.Drawing.Point(158, 19);
		this.Label3.Name = "Label3";
		this.Label3.Size = new System.Drawing.Size(115, 13);
		this.Label3.TabIndex = 1;
		this.Label3.Text = "Id Dispositivo instalado";
		this.Button1.Location = new System.Drawing.Point(489, 254);
		this.Button1.Name = "Button1";
		this.Button1.Size = new System.Drawing.Size(96, 30);
		this.Button1.TabIndex = 3;
		this.Button1.Text = "Aceptar";
		this.Button1.UseVisualStyleBackColor = true;
		this.DatosDataSet.DataSetName = "DatosDataSet";
		this.DatosDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.FechasBindingSource.DataMember = "Fechas";
		this.FechasBindingSource.DataSource = this.DatosDataSet;
		this.FechasTableAdapter.ClearBeforeFill = true;
		this.TableAdapterManager.BackupDataSetBeforeUpdate = false;
		this.TableAdapterManager.datosappTableAdapter = null;
		this.TableAdapterManager.DescargasTableAdapter = null;
		this.TableAdapterManager.FechasTableAdapter = this.FechasTableAdapter;
		this.TableAdapterManager.UpdateOrder = IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.TableAdapterManager.UpdateOrderOption.InsertUpdateDelete;
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 13f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(591, 291);
		base.Controls.Add(this.Button1);
		base.Controls.Add(this.GroupBox1);
		base.Controls.Add(this.Label1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.Fixed3D;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "Historial_Cargas";
		base.ShowIcon = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "Historial de Carga de Datos";
		this.GroupBox1.ResumeLayout(false);
		this.GroupBox1.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.DatosDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.FechasBindingSource).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	private void Historial_Cargas_FormClosing(object sender, FormClosingEventArgs e)
	{
		MyProject.Forms.Base_Datos_Vehiculos.Visible = true;
	}

	private void Historial_Cargas_Load(object sender, EventArgs e)
	{
		FechasTableAdapter.Fill(DatosDataSet.Fechas);
		string text = MyProject.Forms.Base_Datos_Vehiculos.vehiculo;
		if (text.Length == 1)
		{
			text = "00000" + text;
		}
		else if (text.Length == 2)
		{
			text = "0000" + text;
		}
		else if (text.Length == 3)
		{
			text = "000" + text;
		}
		else if (text.Length == 4)
		{
			text = "00" + text;
		}
		else if (text.Length == 5)
		{
			text = "0" + text;
		}
		string filterExpression = "Id_RG like '" + text + "'";
		Lista_cargas = DatosDataSet.Fechas.Select(filterExpression);
		if (Lista_cargas.GetUpperBound(0) == -1)
		{
			ListBox1.Items.Clear();
			ListBox1.Items.Add("Vehículo sin datos cargados.");
		}
		else
		{
			ListBox1.Items.Clear();
			int upperBound = Lista_cargas.GetUpperBound(0);
			for (int i = 0; i <= upperBound; i = checked(i + 1))
			{
				string item = Conversions.ToString(Lista_cargas[i][1]);
				ListBox1.Items.Add(item);
			}
		}
		ListBox1.SelectedIndex = 0;
		actualizar_casillas_cargas();
	}

	private void Button1_Click(object sender, EventArgs e)
	{
		Close();
	}

	private void actualizar_casillas_cargas()
	{
		if (Operators.ConditionalCompareObjectEqual(ListBox1.SelectedItem, "Vehículo sin datos cargados.", TextCompare: false))
		{
			TextBox1.Text = "";
			TextBox2.Text = "";
			TextBox3.Text = "";
			TextBox4.Text = "";
			TextBox5.Text = "";
			TextBox6.Text = "";
			return;
		}
		TextBox1.Text = Conversions.ToString(Lista_cargas[ListBox1.SelectedIndex][4]);
		TextBox2.Text = Conversions.ToString(Lista_cargas[ListBox1.SelectedIndex][1]);
		TextBox3.Text = Conversions.ToString(Lista_cargas[ListBox1.SelectedIndex][2]);
		TextBox4.Text = Conversions.ToString(Lista_cargas[ListBox1.SelectedIndex][5]);
		TextBox5.Text = Conversions.ToString(Lista_cargas[ListBox1.SelectedIndex][6]);
		string text = "";
		string path = Conversions.ToString(Lista_cargas[ListBox1.SelectedIndex][7]);
		try
		{
			using (StreamReader streamReader = new StreamReader(path))
			{
				text = streamReader.ReadToEnd();
				streamReader.Close();
			}
			TextBox6.Text = text;
		}
		catch (Exception ex)
		{
			ProjectData.SetProjectError(ex);
			Exception ex2 = ex;
			TextBox6.Text = "No se ha podido leer el archivo de Carga de Datos";
			ProjectData.ClearProjectError();
		}
	}

	private void ListBox1_SelectedIndexChanged(object sender, EventArgs e)
	{
		actualizar_casillas_cargas();
	}
}
