const { Command, colors } = require('../../utils')
const moment = require('moment')
moment.locale('pt-br')

module.exports = class Registrar extends Command {
  constructor(name, client) {
    super(name, client)

    this.name = 'register'
    this.aliases = ['registrar', 'register', 'r']
    this.category = 'Registry'
    this.subcommandsOnly = false
  }

  async run(message) {
    const guildDocument = await this.client.database.guild.getOrCreate(message.guild.id)
      .then(guildTable => {
        const member = message.mentions.members.first();
        if (!member) {
          return message.reply('Mencione o usuário que deseja registrar!').catch(() => { });
        }
        const hit = guildTable.registradores.some(registrador => {
          return registrador.membrosRegistrados.some(membro => membro._id === member.id);
        });
        if (hit) {
          return message.reply('Usuário já registrado').catch(() => { });
        }
        const masculino = message.guild.roles.cache.get(guildTable.masculino);
        const feminino = message.guild.roles.cache.get(guildTable.feminino);
        const nbinario = message.guild.roles.cache.get(guildTable.nbinario);
        if (!masculino || !feminino) {
          return message.reply(`O comando não foi configurado, para ter mais informações digite ${guildTable.prefix}Registry `).catch(() => { });
        }
        const masculinoCheck = member.roles.cache.has(guildTable.masculino);
        const femininoCheck = member.roles.cache.has(guildTable.feminino);
        const nBinarioCheck = member.roles.cache.has(guildTable.nbinario);
        if ((masculinoCheck && femininoCheck) || (masculinoCheck && nBinarioCheck) || (femininoCheck && nBinarioCheck)) {
          return message.reply('O usuário possui mais de um cargo do Registry (masculino, feminino e não binário), deixe um e tente novamente ').catch(() => { });
        } else if (!masculinoCheck && !femininoCheck && !nBinarioCheck) {
          return message.reply(`**Registry incompleto!** Verifique se o mesmo possui a tag \`masculino\` ou \`feminino\` ou \`não binário\` em seu Registry. `).catch(() => { });
        }
        let gender;
        if (masculinoCheck) gender = 'M';
        if (femininoCheck) gender = 'F';
        if (nBinarioCheck) gender = 'N';
        if (guildTable.registradores.length < 1) {
          guildTable.registradores[0] = {
            _id: message.author.id,
            membrosRegistrados: [{
              _id: member.id,
              genero: gender,
              timestamp: message.createdTimestamp
            }]
          };
        } else {
          const index = guildTable.registradores.findIndex(r => r._id === message.author.id);
          if (index >= 0) {
            const membersNum = guildTable.registradores[index].membrosRegistrados.length;
            guildTable.registradores[index].membrosRegistrados[membersNum] = {
              _id: member.id,
              genero: gender,
              timestamp: message.createdTimestamp
            };
          } else {
            guildTable.registradores[guildTable.registradores.length] = {
              _id: message.author.id,
              membrosRegistrados: [{
                _id: member.id,
                genero: gender,
                timestamp: message.createdTimestamp
              }]
            };
          }
        }
        if (guildTable.registradores.length) {
          let registradorID = '';
          const registradores = guildTable.registradores;
          for (let u = 0; u < registradores.length; ++u) {
            const memberArr = registradores[u].membrosRegistrados;
            for (let i = 0; i < memberArr.length; ++i) {
              if (memberArr[i]._id === member.id) {
                let timestamp = 0;
                registradorID = registradores[u]._id;
                timestamp = memberArr[i].timestamp;
                u = registradores.length;
                break;
              }
            }
          }
        }
        guildTable.save()
          .then(() => {
            const novatoRole = message.guild.roles.cache.get(guildTable.novato);
            if (novatoRole) {
              member.roles.remove(novatoRole.id, 'Registry').catch(() => { });
            }
            const registradoRole = message.guild.roles.cache.get(guildTable.registrado);
            if (registradoRole) {
              member.roles.add(registradoRole.id, 'Registry').catch(() => { });
            }//member.roles.map(role => role.name()).join(", ")
                        //message.guild.member(message.author).roles.map(r => r.name).join(', ');
            const cargos = message.guild.member(member.id).roles.cache.map(r => r.name).join(', ');
                        //var cargos = message.guild.members.get(member.id).roles.map(role => role.name).join(', ');
            const { MessageEmbed } = require('discord.js');
            let canal = message.guild.channels.cache.get(guildTable.channelRegister)
            if (!canal) canal = message.channel;

            const embedSv = new MessageEmbed()
              .setAuthor(`Registrador(a): ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true, size: 1024 }))
              .setDescription(`${message.author} você Registryu o usuário(a) ${member} com sucesso.`)
              .setFooter('Depois desse Registry cairia bem um bolo né? 🍰')
              .setColor(colors.default);

            canal.send({ embeds: [embedSv] }).catch(() => { });

            message.reply('<:concludo:739830713792331817> **|** Usuário registrado com sucesso.').then(msg => { msg.delete({ timeout: 5000 }) })

            const embedDM1 = new MessageEmbed()
              .setTitle(`${message.guild.name} | Notificação Registry`)
              .setDescription(`<:Registryeyey:739837234097684582> **Você foi registrado(a) por ${message.author}, no Servidor: __${member.guild.name}__.\n` + `Caso não tenha se registrado por essa pessoa, entre em contato com <@${message.guild.owner.id}>.**`)
              .addField(`Cargos Recebidos`, `\`\`\`\n${cargos.replace('@everyone, ', '' && '@here, ', '')}\`\`\``, false)
              .addField('Data do Registry:', `\`\`\`\n${moment(timestamp).format('LL')}\`\`\``, false)
              .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 1024 }))
              .setFooter('Depois desse Registry cairia bem um bolo né? 🍰')
              .setColor(colors.default)

            const embedDM2 = new MessageEmbed()
              .setDescription(`<:a_blurplepartner:856174395869626399> **Olá! Gostou da Jeth? quer saber de novidades diárias , sempre está atualizado sobre novos comandos! entre no [suporte](https://discord.gg/VnYbWUz3ZZ)**`)
              .setColor(colors.default)

            member.send(embedDM1).catch(() => { });
            member.send(embedDM2).catch(() => { });

          })
          .catch(console.error);
      })
      .catch(console.error);
  }
}